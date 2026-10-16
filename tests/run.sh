#!/bin/bash
# 双向验证：正例必须报，反例必须不报（误报是安全工具的头号杀手）
set -uo pipefail
export PATH="/usr/local/bin:$PATH"
cd "$(dirname "$0")/.."
PASS=0; FAIL=0
ok(){ echo "  ✅ $1"; PASS=$((PASS+1)); }
bad(){ echo "  ❌ $1"; FAIL=$((FAIL+1)); }

echo ""; echo "  $(node -p "require('./package.json').name") · 双向验证"
echo "  ────────────────────────────────────────────────"

echo ""; echo "  【正例】违规样本（每条规则都必须报出）"
J=$(node bin/cli.mjs --root tests/fixtures/fail/demo-project --json 2>&1)
for rid in ENV-NOT-IGNORED ENV-FILE-PERM ENV-PLAINTEXT ENV-NO-EXAMPLE ENV-HARDCODED-CONFIG; do
  c=$(echo "$J" | python3 -c "
import json,sys
try:
    d=json.load(sys.stdin)
    print(len([f for f in d.get('findings',[]) if f.get('ruleId')=='$rid']))
except Exception: print(0)" 2>/dev/null)
  [ "${c:-0}" -gt 0 ] && ok "$rid 报出（$c 处）" || bad "$rid 未报出"
done

echo ""; echo "  【反例】合规样本（必须 0 命中）"
M=$(node bin/cli.mjs --root tests/fixtures/pass/clean-project --quiet 2>&1 | grep -oE '^[0-9]+' | head -1)
[ "${M:-1}" = "0" ] && ok "干净样本 0 命中" || bad "误报 ${M} 条"

echo ""; echo "  【证据】明文样本不得把密钥值打进报告"
if echo "$J" | grep -qE 'Pr0d-S3cret|stripe_live_51H8|8f4c1d2ab73e5096|mailgun-2c9f4a'; then
  bad "报告里泄露了 .env 的真实值"
else
  ok "报告只输出键名，不输出真实值"
fi

echo ""; echo "  【溯源】每条规则必须带 source"
python3 - <<'PY' && ok "全部规则均有 source" || bad "有规则缺 source"
import json,glob,sys
bad=[json.load(open(f,encoding='utf-8')).get('id') for f in glob.glob('rules/*.json') if not json.load(open(f,encoding='utf-8')).get('source')]
if bad: print('缺 source:',bad,file=sys.stderr); sys.exit(1)
PY

echo ""; echo "  ────────────────────────────────────────────────"
echo "  通过 $PASS · 失败 $FAIL"; echo ""
[ "$FAIL" -eq 0 ] || exit 1
