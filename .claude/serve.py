import sys, os
os.chdir('/Users/toshik/Desktop/Claude Projects/portfolio-website')
from http.server import HTTPServer, SimpleHTTPRequestHandler
port = int(os.environ.get('PORT', sys.argv[1] if len(sys.argv) > 1 else 3000))
print(f'Serving on port {port}', flush=True)
HTTPServer(('', port), SimpleHTTPRequestHandler).serve_forever()
