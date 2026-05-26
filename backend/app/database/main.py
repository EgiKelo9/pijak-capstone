import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import get_settings
from app.shared.transaction_manager import TransactionManager

setting = get_settings()
DATABASE_TARGET_URL = f"{setting.DATABASE_URL}{setting.DATABASE_NAME}"

engine = create_engine(DATABASE_TARGET_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Get a session for interacting with the database"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
def create_db():
    setting = get_settings()
    
    default_db_url = setting.DATABASE_URL
    db_engine_default = create_engine(default_db_url, isolation_level="AUTOCOMMIT")
    
    try:
        with db_engine_default.connect() as conn:
            conn.execute(text(f"CREATE DATABASE {setting.DATABASE_NAME};"))
            print(f"Database {setting.DATABASE_NAME} created successfully.")
    except Exception as e:
        print(f"Info: Database creation skipped (might already exist). Error: {e}")
        
    db_engine_default.dispose()

    session = SessionLocal() 
    tm = TransactionManager(session)
    
    init_sql_path = os.path.join(os.path.dirname(__file__), "init.sql")
    
    try:
        with open(init_sql_path, "r", encoding="utf-8") as file:
            sql_script = file.read()
        
        statements = [stmt.strip() for stmt in sql_script.split(';') if stmt.strip()]
        
        for statement in statements:
            if statement.upper().startswith("CREATE DATABASE"):
                continue
            
            try:
                with tm.transaction() as db_session:
                    db_session.execute(text(statement))
            except Exception as stmt_error:
                print(f"⚠️ Statement dilewati (Error): {stmt_error}")
                
        print("✅ Semua tabel dan data dummy selesai dieksekusi!")
    except Exception as e:
        print(f"❌ Error fatal saat membaca init.sql: {e}")
    finally:
        session.close()