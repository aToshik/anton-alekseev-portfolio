import os, sys
os.chdir('/Users/toshik/Desktop/Claude Projects/portfolio-website')
port = os.environ.get('PORT', '3000')
sys.argv = ['serve', port]
import http.server
http.server.main()
