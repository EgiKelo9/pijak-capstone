import os
import time
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError # <-- FIXED: Must use SQLAlchemy's error
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import get_settings
from app.shared.transaction_manager import TransactionManager

setting = get_settings()
DEFAULT_DB_URL = setting.DATABASE_URL
DATABASE_TARGET_URL = f"{setting.DATABASE_URL}{setting.DATABASE_NAME}"

# SQLAlchemy engines are lazy. They won't actually connect until you execute a query.
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

def wait_for_db(url: str, retries: int = 5, delay: int = 3):
    """Patiently waits for PostgreSQL to wake up before running any setup."""
    for i in range(retries):
        try:
            temp_engine = create_engine(url)
            with temp_engine.connect():
                print(f"✅ Successfully connected to PostgreSQL server.")
                temp_engine.dispose()
                return
        except OperationalError:
            print(f"⏳ Database not ready. Retrying in {delay} seconds... ({i+1}/{retries})")
            time.sleep(delay)
            
    raise Exception("❌ Could not connect to PostgreSQL after multiple retries.")

def create_db():
    setting = get_settings()
    
    # 1. Wait for the main Postgres server to be awake
    wait_for_db(DEFAULT_DB_URL)
    
    # 2. Connect to the default URL (without target DB name) to create the database
    db_engine_default = create_engine(DEFAULT_DB_URL, isolation_level="AUTOCOMMIT")
    
    try:
        with db_engine_default.connect() as conn:
            conn.execute(text(f"CREATE DATABASE {setting.DATABASE_NAME};"))
            print(f"✅ Database '{setting.DATABASE_NAME}' created successfully.")
    except Exception as e:
        print(f"ℹ️ Info: Database creation skipped (might already exist).")
    finally:
        db_engine_default.dispose()

    # 3. Now that the DB exists, safely run the init.sql script
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