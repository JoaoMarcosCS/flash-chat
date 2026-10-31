
```
express
├─ README.md
├─ package.json
├─ src
│  ├─ infra
│  │  ├─ container
│  │  │  └─ index.ts
│  │  ├─ database
│  │  │  ├─ data-source.ts
│  │  │  └─ migrations
│  │  ├─ http
│  │  │  ├─ index.ts
│  │  │  ├─ middleware
│  │  │  ├─ routes
│  │  │  │  └─ v1
│  │  │  ├─ security
│  │  │  └─ server.ts
│  │  └─ logging
│  ├─ modules
│  │  ├─ module-1
│  │  │  ├─ controller
│  │  │  ├─ entity
│  │  │  ├─ repository
│  │  │  └─ service
│  │  └─ module-2
│  ├─ shared
│  │  ├─ docs
│  │  ├─ enums
│  │  ├─ environment
│  │  ├─ errors
│  │  └─ utils
│  └─ tests
│     ├─ modules
│     └─ utils
├─ step-by-step.md
├─ tsconfig.json
└─ yarn.lock

```
```
express
├─ .dockerignore
├─ .husky
│  ├─ pre-commit
│  └─ pre-push
├─ .nvmrc
├─ .prettierignore
├─ .prettierrc
├─ Dockerfile
├─ Makefile
├─ README.md
├─ docker-compose.yml
├─ eslint.config.mts
├─ package.json
├─ public
├─ src
│  ├─ @types
│  │  └─ express
│  │     └─ index.d.ts
│  ├─ infra
│  │  ├─ container
│  │  │  └─ index.ts
│  │  ├─ database
│  │  │  ├─ data-source.ts
│  │  │  └─ migrations
│  │  │     └─ 1775784363507-CreateTableX.ts
│  │  ├─ http
│  │  │  ├─ index.ts
│  │  │  ├─ middleware
│  │  │  ├─ routes
│  │  │  │  └─ v1
│  │  │  │     ├─ index.ts
│  │  │  │     └─ x
│  │  │  │        └─ x.route.ts
│  │  │  ├─ security
│  │  │  └─ server.ts
│  │  └─ logging
│  ├─ modules
│  │  ├─ module-1
│  │  │  ├─ entity
│  │  │  │  └─ module.entity.ts
│  │  │  ├─ repository
│  │  │  │  ├─ IXRespository.ts
│  │  │  │  └─ x.repository.ts
│  │  │  └─ use-cases
│  │  │     ├─ create
│  │  │     │  ├─ create-x-request.schema.ts
│  │  │     │  ├─ create-x.controller.ts
│  │  │     │  └─ create-x.usecase.ts
│  │  │     └─ get
│  │  └─ module-2
│  ├─ shared
│  │  ├─ docs
│  │  ├─ enums
│  │  │  └─ erros.enum.ts
│  │  ├─ environment
│  │  │  └─ env.ts
│  │  ├─ errors
│  │  │  └─ errors.ts
│  │  └─ utils
│  │     ├─ environment-check.ts
│  │     └─ validation-with-zod.ts
│  └─ tests
│     ├─ modules
│     │  ├─ create-x-usecase.test.ts
│     │  └─ routes.integration.test.ts
│     ├─ setup.ts
│     └─ utils
│        ├─ environment-check.test.ts
│        ├─ errors.test.ts
│        └─ validation-with-zod.test.ts
├─ step-by-step.md
├─ tsconfig.build.json
├─ tsconfig.json
├─ vitest.config.ts
└─ yarn.lock

```