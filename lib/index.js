import { createPlugin, pkgRootFrom } from '@deepwhale-cn/dsh-guard-core/plugin';

export const { name, inject, apply } = createPlugin({
  name: 'env-audit',
  pkgRoot: pkgRootFrom(import.meta.url),
  skillFile: 'skill/env-audit.md',
  binFile: 'bin/cli.mjs',
  description: '.env 有没有被提交、权限对不对、里面是不是明文',
  whenToUse: '需要审计项目的环境配置文件本身（.env 是否被 .gitignore 忽略、权限是否过宽、'
    + '里面是不是明文密钥、有没有 .env.example 模板）时用。'
    + '用户会说：「.env 会不会被提交」「我的密钥是不是进 git 了」「环境变量配置文件有问题吗」'
    + '「上线前查一下配置」「.env 权限对吗」。'
    + '注意：这个查的是配置文件本身；代码里的密钥字面量归 dsh-secret-scan。',
});
