from typing import List
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from backend import model, schema, OAuth2
from backend.database import get_db

router = APIRouter(prefix="/notes", tags=["Notes"])


@router.post("/", response_model=schema.NoteResponse, status_code=status.HTTP_201_CREATED)
def create_note(request: schema.NoteCreate, db: Session = Depends(get_db), 
                current_user: model.User = Depends(OAuth2.get_current_user),):
    
    note = model.Note(title=request.title, content=request.content, user_id=current_user.id)
    db.add(note)
    db.commit()
    db.refresh(note)

    return note


@router.get("/", response_model=List[schema.NoteResponse])
def get_user_notes(db: Session = Depends(get_db), current_user: model.User = Depends(OAuth2.get_current_user),):
    return (
        db.query(model.Note).filter(model.Note.user_id == current_user.id).order_by(model.Note.created_at.desc(), model.Note.id.desc()).all()
    )


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(id: int,db: Session = Depends(get_db),current_user: model.User = Depends(OAuth2.get_current_user)):
    note = (
        db.query(model.Note).filter(model.Note.id == id, model.Note.user_id == current_user.id).first()
    )
    if not note:
        raise HTTPException(status_code=404, detail="Note not found or unauthorized")

    db.delete(note)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)