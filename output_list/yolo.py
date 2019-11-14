import requests

f = open('save.txt', 'r', encoding='utf-8')
cnt=0

for line in f:
    try:
        img_data = requests.get(line).content
        print("saving img%d" % cnt)
        with open("./error/motor%d.jpg" % cnt, 'wb') as handler:
            handler.write(img_data)
        cnt += 1
    except Exception:
        continue
