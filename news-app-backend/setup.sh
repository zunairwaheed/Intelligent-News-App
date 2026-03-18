#!/bin/bash
# Backend setup script

echo "Setting up Django backend..."

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy env file
if [ ! -f .env ]; then
  cp .env.example .env
  echo ""
  echo "IMPORTANT: Edit .env and set:"
  echo "  SECRET_KEY  — a long random string"
  echo "  NEWSDATA_API_KEY — your key from https://newsdata.io"
  echo ""
fi

# Run migrations
python manage.py makemigrations accounts
python manage.py makemigrations news
python manage.py migrate

# Create superuser prompt
echo ""
echo "Create admin account (for approving news submissions):"
python manage.py createsuperuser

echo ""
echo "Setup complete! Run the server with:"
echo "  source venv/bin/activate && python manage.py runserver 0.0.0.0:8000"
