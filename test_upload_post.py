import requests, json
with open('test_upload.pdf','rb') as f:
    r = requests.post('http://localhost:3001/api/upload', files={'image': f})
    out = {'status': r.status_code, 'text': r.text}
    with open('test_upload_response.json','w', encoding='utf-8') as fo:
        json.dump(out, fo, ensure_ascii=False, indent=2)
    print('WROTE test_upload_response.json')
