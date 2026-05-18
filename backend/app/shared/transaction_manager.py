from contextlib import contextmanager
from sqlalchemy.orm import Session

class TransactionManager:
    """
    A class to manage database transactions in FastAPI using SQLAlchemy.
    Ensures that the session is committed or rolled back based on success or failure.
    """
    
    def __init__(self, session: Session):
        self.session = session
    
    @contextmanager
    def transaction(self):
        """
        A context manager that wraps the database transaction, ensuring commit or rollback.
        Use this context to ensure transactions are handled correctly.
        """
        try:
            yield self.session
            self.session.commit()
        except Exception as e:
            self.session.rollback()
            raise e