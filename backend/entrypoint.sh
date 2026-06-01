#!/bin/sh
set -e

flask db upgrade
flask seed-admin
exec python run.py
