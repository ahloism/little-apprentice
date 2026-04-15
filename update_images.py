import json, glob, os

IMG_MAP = {
    'A01': 'A01_阿禾思考中',
    'A02': 'A02_封面',
    'A03': 'A03_謎語一示意_頭',
    'A04': 'A04_謎語二示意_馬',
    'A05': 'A05_誠信木匾',
    'C01': 'C01_阿禾',
    'C02': 'C02_阿水',
    'C03': 'C03_錢伯',
    'C04': 'C04_石頭',
    'C05': 'C05_梅姐',
    'C06': 'C06_阿乖',
    'C07': 'C07_王三',
    'C08': 'C08_杜先生',
    'C09': 'C09_老梁',
    'C10': 'C10_錢平',
    'M01': 'M01_大事件一地圖',
    'O01': 'O01_布包',
    'O03': 'O03_鑰匙串',
    'O04': 'O04_舊靴',
    'O05': 'O05_糖葫蘆',
    'O06': 'O06_煎餅',
    'O07': 'O07_花生袋',
    'O08': 'O08_湯圓粉',
    'O09': 'O09_麥芽糖',
    'O10': 'O10_臘腸',
    'O11': 'O11_磨刀',
    'O12': 'O12_涼茶',
    'O13': 'O13_繩子布料',
    'O14': 'O14_茶壺',
    'O15': 'O15_繩子',
    'O16': 'O16_空竹簍',
    'O17': 'O17_筆',
    'O18': 'O18_阿禾的紙',
    'O19': 'O19_字帖',
    'O20': 'O20_茶壺茶水台',
    'O21': 'O21_紙扇',
    'O22': 'O22_粗繩木樁',
    'O23': 'O23_草帽',
    'O25': 'O25_老梁的信',
    'S01': 'S01_大梁城街道',
    'S02': 'S02_商行門口',
    'S03': 'S03_倉庫',
    'S04': 'S04_市集街道',
    'S05': 'S05_雜耍空地',
    'S07': 'S07_梁河橋邊',
    'S08': 'S08_梁河碼頭方向',
    'S09': 'S09_橋上攤檔',
    'S10': 'S10_老梁攤檔',
    'S11': 'S11_化糞池門口',
    'S12': 'S12_賭坊巷口',
    'S13': 'S13_客棧門口',
    'S14': 'S14_客棧內部',
    'S15': 'S15_說書台',
    'S16': 'S16_碼頭',
    'S17': 'S17_帳房',
    'W01': 'W01_糞',
    'W02': 'W02_信',
    'W03': 'W03_家',
    'W04': 'W04_急',
    'W05': 'W05_病',
}

# 找json/v5/資料夾
script_dir = os.path.dirname(os.path.abspath(__file__))
# 嘗試幾個可能路徑
possible = [
    os.path.join(script_dir, '..', 'json', 'v5'),
    os.path.join(script_dir, 'json', 'v5'),
]
json_dir = None
for p in possible:
    if os.path.isdir(p):
        json_dir = os.path.abspath(p)
        break

if not json_dir:
    print('找不到json/v5資料夾，請把腳本放在little-apprentice根目錄執行')
    exit(1)

print(f'找到JSON目錄：{json_dir}')

files = glob.glob(os.path.join(json_dir, 'presentation_schema_*.json'))
if not files:
    print('找不到presentation_schema文件')
    exit(1)

total_updated = 0
for fpath in sorted(files):
    with open(fpath, encoding='utf-8') as f:
        data = json.load(f)

    changed = 0
    for scene in data.get('scenes', []):
        # 單一image欄位
        if scene.get('image') and scene['image'] in IMG_MAP:
            scene['image'] = IMG_MAP[scene['image']]
            changed += 1
        # display_images陣列
        if scene.get('display_images'):
            new_list = []
            for code in scene['display_images']:
                if code in IMG_MAP:
                    new_list.append(IMG_MAP[code])
                    changed += 1
                else:
                    new_list.append(code)
            scene['display_images'] = new_list

    with open(fpath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f'{os.path.basename(fpath)}: {changed} 個code已更新')
    total_updated += changed

print(f'\n完成，共更新 {total_updated} 個image code')
