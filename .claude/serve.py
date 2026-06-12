import os, sys
os.chdir('/Users/toshik/Desktop/Claude Projects/portfolio-website')
sys.argv = ['serve', '3000']
import http.server
http.server.main()
