# @deepwhale-cn/dsh-env-audit

**在你把密钥提交进 git 之前，先看一眼 `.env` 本身。**

**关键词**：配置文件审计 · .env 检查 · 密钥进 git · 文件权限 · 明文密码 · gitignore · 环境变量 · .env.example · 配置与代码分离

---

## 先说清楚它是什么、不是什么

**是**：只盯**环境配置文件本身**的四件事 —— 会不会被提交、权限宽不宽、里面是不是明文、有没有模板。

**不是**：
- ❌ **不是密钥扫描器** —— 扫**代码里的密钥字面量**（`sk-...`、AKIA...）是 `dsh-secret-scan` 的活
- ❌ **不是密钥管理工具** —— 它不存密钥、不轮换、不加密
- ❌ **不是运行时防护** —— 不拦读取，只做静态审计
- ❌ **不下「安全 / 不安全」的结论** —— 只描述事实，判断留给你

**一句话分界**：
```
secret-scan = 代码里有没有写死密钥
env-audit   = 配置文件本身有没有把密钥暴露出去
```

---

## 它查什么（5 条）

| 规则 | 查什么 | 级别 |
|---|---|---|
| `ENV-NOT-IGNORED` | `.gitignore` / `.git/info/exclude` 里没有忽略 `.env`，而项目里有凭据型环境配置 | 🔴 |
| `ENV-PLAINTEXT` | `.env` 里 `PASSWORD=` / `SECRET=` / `TOKEN=` / `API_KEY=` 跟的是明文而非占位符 | 🔴 |
| `ENV-FILE-PERM` | `.env` 权限宽于 `600`（同机器其他用户可读）| 🟡 |
| `ENV-NO-EXAMPLE` | 有环境配置内容，却找不到 `.env.example` / `.env.sample` 模板 | 🔵 |
| `ENV-HARDCODED-CONFIG` | 源码里硬编码内网/私有网段地址或 `.internal` 主机名 | 🔵 |

**每条都会给出：哪个文件、第几行、证据、依据（可查证的标准/文档）、以及怎么办。**

---

## 安装

```bash
dsh plugin --profile web add @deepwhale-cn/dsh-env-audit
```

## 用法

```bash
# 审计当前目录
dsh-env-audit

# 审计指定目录
dsh-env-audit --root /path/to/project

# 看内置演示（一个「.env 没忽略 + 644 + 明文密码 + 没有模板」的项目）
dsh-env-audit --demo

# 列出规则与依据
dsh-env-audit --list-rules

# 出 HTML 报告（可截图归档）
dsh-env-audit --root . --html env-audit.html

# 挂 CI：有 high 命中时退出码 1
dsh-env-audit --quiet --json
```

---

## 一个真实的例子

`--demo` 那个样本项目的一切看起来都很正常：有 `package.json`、有 `src/`、有 `.gitignore`。

`dsh-env-audit` 看见的：

```
🔴 .gitignore 没忽略 .env，且有凭据型环境配置            .gitignore
🔴 .env 明文：DB_PASSWORD=      （报告只到等号为止）   .env:10
🔴 .env 明文：STRIPE_SECRET_KEY=                      .env:14
🔴 .env 明文：JWT_SECRET=                             .env:15
🔴 .env 明文：SMTP_PASSWORD=                          .env:16
🟡 .env 权限 644 超过上限 600                          .env
🔵 有凭据型环境配置，却找不到 .env.example 模板         .env.example
🔵 源码硬编码内网地址 10.0.3.12                        src/db.js:4
```

**这 8 条，`git add .` 之前就能看见。**

---

## 关于「明文」这条规则的两个设计取舍

1. **报告里不会出现你的密钥值。** 正则只吃到 `KEY=` 为止，值是用零宽断言「验证存在」的 —— 所以证据栏永远是 `DB_PASSWORD=` 这个样子。工具自己不能变成泄露源。
2. **占位符不算。** `空值`、`${DB_PASSWORD}`、`<generate-with-openssl-rand>`、`your_xxx`、`changeme`、`xxx`、`test`、`example` 这类写法会被跳过。

## 边界（说清楚做不到什么）

- **不知道 `.env` 是不是「已经」提交过** —— 核心引擎是离线文件扫描，不读 git 索引。规则报的是「当前 `.gitignore` 没忽略它」，以及「忽略它不等于已提交的历史被清掉」。已提交过的情况请用 `git log --all -- .env` 自查。
- **权限规则只在 POSIX（Linux/macOS）上有意义** —— Windows 没有这套权限位；若在 Windows 上跑，`600` 的比较结果不可用。
- **`ENV-NOT-IGNORED` 和 `ENV-NO-EXAMPLE` 有「适用门槛」** —— 引擎的 `when` 门槛是「某处存在形如 `...PASSWORD=` / `SECRET=` / `TOKEN=` / `API_KEY=` / `CREDENTIAL=` 的赋值行」。带来两个后果：
  - 只写小写键名、或只含 `NODE_ENV` / `PORT` 这类无凭据项的环境文件，**不会**触发这两条（报告里会标为「因不适用未运行」）
  - 非 `.env` 的配置文件（`.ini`、`.properties` 等）里出现同形状的凭据赋值时，**也会**触发 —— 因为 `when` 门槛看不到文件名。此时标题只陈述「没有忽略 .env」和「有凭据型环境配置」两个事实，不宣称 `.env` 一定存在
- **明文规则只认常见的高危键名**（PASSWORD / PASSWD / SECRET / TOKEN / API_KEY / ACCESS_KEY / PRIVATE_KEY / CREDENTIAL）—— 自定义键名（如 `FOO=真实密钥`）不报。
- **`ENV-NOT-IGNORED` 是「整仓库任一 `.gitignore` 忽略了 `.env` 就算过」** —— 语义是「仓库里有没有忽略 .env 的地方」。这符合 gitignore 可叠加的实际行为；代价是：多包仓库里如果只有某一个子目录的 `.gitignore` 写了 `.env`，就不会报（单一根 `.gitignore` 的项目不受影响）。
- **只看 `.env` 系列文件** —— `config.json`、`settings.yaml` 里的明文凭据不归它管。
- **硬编码地址规则是低优先提示** —— 内网地址写在代码里不一定有问题，它只是违反「配置与代码分离」，报出来让你确认。

## 依据

每条规则的 `source` 都能查到原文：

- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html) —— 凭据不应进入版本控制；密钥应对最小范围可读；要让使用者清楚需要哪些配置项
- [The Twelve-Factor App · III. Config](https://12factor.net/config) —— 「配置与代码严格分离」，并明确指出配置文件「很容易被误提交进仓库」
- [Git · gitignore 官方文档](https://git-scm.com/docs/gitignore) —— 用 `.gitignore` 声明哪些文件不纳入版本控制

---


---

## 深鲸网安守护系列（共 31 个）

> 一个插件做一件事。**安全问题是链式的** —— 配套用才完整。

**国内合规** ｜ [等保对照](https://github.com/feely0208/dsh-cn-mlps) · [日志留存](https://github.com/feely0208/dsh-cn-log-retention) · [备案公示](https://github.com/feely0208/dsh-cn-filing) · [用户同意](https://github.com/feely0208/dsh-consent-guard) · [个人信息权利](https://github.com/feely0208/dsh-data-rights) · [未成年人保护](https://github.com/feely0208/dsh-minor-guard) · [影响评估](https://github.com/feely0208/dsh-pipia) · [数据分类分级](https://github.com/feely0208/dsh-data-classify) · [算法备案](https://github.com/feely0208/dsh-algorithm-filing) · [数据出境](https://github.com/feely0208/dsh-cn-data-export) · [国密合规](https://github.com/feely0208/dsh-cn-crypto) · [AI 内容标识](https://github.com/feely0208/dsh-cn-ai-labeling)

**AI 与 Agent 治理** ｜ [AI 输出信任](https://github.com/feely0208/dsh-ai-output-trust) · [外部内容信任](https://github.com/feely0208/dsh-content-trust) · [MCP 安全](https://github.com/feely0208/dsh-mcp-audit) · [Agent 权限](https://github.com/feely0208/dsh-agent-scope) · [策略核对](https://github.com/feely0208/dsh-agent-policy) · [可疑指令](https://github.com/feely0208/dsh-phishing-guard)

**数据与凭据** ｜ [敏感数据](https://github.com/feely0208/dsh-data-scan) · [密钥轮换](https://github.com/feely0208/dsh-key-rotate) · [数据留存](https://github.com/feely0208/dsh-data-lifecycle) · [**配置审计**](https://github.com/feely0208/dsh-env-audit) · [密钥扫描](https://github.com/feely0208/dsh-secret-scan)

**供应链与构建** ｜ [开源许可](https://github.com/feely0208/dsh-license-guard) · [依赖投毒](https://github.com/feely0208/dsh-dep-audit) · [CI 安全](https://github.com/feely0208/dsh-ci-guard) · [工具审查](https://github.com/feely0208/dsh-tool-vet) · [物料清单](https://github.com/feely0208/dsh-sbom)

**权限与应急** ｜ [最小权限](https://github.com/feely0208/dsh-least-privilege) · [告警外发](https://github.com/feely0208/dsh-alert-relay) · [应急证据包](https://github.com/feely0208/dsh-incident-package)

都在 DSH 插件市场（dsh-plugin.org）、npm 和 deepwhale.org.cn/guard.html 上。

## License

MIT © 深鲸 DeepWhale
