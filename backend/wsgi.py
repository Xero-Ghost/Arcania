import sys
import os

project_home = '/home/xero1ghost/Arcania'
if project_home not in sys.path:
    sys.path.append(project_home)

from app import app as application
