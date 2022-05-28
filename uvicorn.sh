#/bin/sh
PATH=$PATH:. uvicorn main:app --port ${PORT:-8000} $@
