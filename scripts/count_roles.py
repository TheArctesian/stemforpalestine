import json
from collections import Counter

with open('../static/signatories.json', 'r') as f:
    data = json.load(f)

role_counts = Counter()

for signatory in data['signatories']:
    if signatory.get('roles'):
        roles = [r.strip() for r in signatory['roles'].split(',')]
        role_counts.update(roles)

print('Role Counts:')
print('============')
for role, count in role_counts.most_common():
    print(f'{count:5} - {role}')
print('============')
print(f"Total signatories: {data['totalCount']}")
