# AGENTS.md — ProxAlert Backend

## Visão geral do projeto

O ProxAlert é um aplicativo mobile de alarmes por proximidade geográfica.

O objetivo principal é permitir que o usuário crie alarmes vinculados a destinos/localizações e seja avisado quando estiver próximo do local escolhido.

Este repositório representa o **backend** do ProxAlert.

## Stack do backend

- Node.js
- NestJS
- TypeScript
- PostgreSQL
- Prisma ORM 7
- Docker para ambiente local
- JWT para autenticação futuramente
- Bcrypt para hash de senha futuramente

## Decisões atuais do projeto

- O projeto foi criado com NestJS.
- O Prisma já foi configurado e está funcionando.
- O projeto usa Prisma 7, então a URL do banco fica no `prisma.config.ts`, não mais diretamente no `schema.prisma`.
- O Prisma Client é gerado em `src/generated/prisma`.
- O `PrismaService` importa o client gerado localmente.
- O projeto usa PostgreSQL via Docker no ambiente local.
- O arquivo `.env` não deve subir para o GitHub.
- O arquivo `docker-compose.yml` real também não deve subir para o GitHub.
- Deve subir apenas o `.env.example` e o `docker-compose.example.yml`.

## Estrutura de pastas desejada

O projeto deve seguir uma organização inspirada em Clean Architecture:

```txt
src/
├── domain/
│   ├── entities/
│   ├── errors/
│   └── repositories/
│
├── application/
│   ├── dtos/
│   └── use-cases/
│
├── infra/
│   ├── database/
│   │   └── prisma/
│   │       ├── prisma.module.ts
│   │       └── prisma.service.ts
│   │
│   └── repositories/
│
├── presentation/
│   └── http/
│       ├── controllers/
│       └── middlewares/
│
├── generated/
│   └── prisma/
│
├── app.module.ts
└── main.ts
```

## Arquitetura e princípios

O projeto deve seguir uma organização inspirada em Clean Architecture, DDD e SOLID.

### DDD

Usar DDD principalmente para proteger as regras de negócio da aplicação.

- Entidades devem representar conceitos importantes do domínio, como User, Alarm, Plan e Location.
- Regras de negócio devem ficar no domínio sempre que possível.
- Evitar colocar regra de negócio em controllers.
- Repositórios devem ser interfaces no domínio e implementações na infraestrutura.
- Prisma não deve aparecer dentro da camada de domínio.

### SOLID

Aplicar SOLID de forma prática, sem exageros.

- Cada classe deve ter uma responsabilidade clara.
- Use cases devem depender de interfaces, não de implementações concretas.
- Controllers devem apenas receber requisições, chamar use cases e retornar respostas.
- Serviços externos como Prisma, JWT e bcrypt devem ficar na infraestrutura.

## Responsabilidade das camadas

### `domain/`

Contém as regras mais puras do negócio.

Deve conter:

- Entidades
- Validações essenciais
- Erros de domínio
- Interfaces de repositórios

Não deve depender de NestJS, Prisma, Express, banco de dados ou bibliotecas externas.

Exemplos futuros:

```txt
domain/entities/user.entity.ts
domain/entities/alarm.entity.ts
domain/errors/business-error.ts
domain/repositories/user-repository.ts
domain/repositories/alarm-repository.ts
```

### `application/`

Contém os casos de uso da aplicação.

Deve coordenar as ações do sistema, usando entidades e interfaces do domínio.

Exemplos futuros:

```txt
application/use-cases/users/create-user.use-case.ts
application/use-cases/alarms/create-alarm.use-case.ts
application/dtos/create-user.dto.ts
application/dtos/create-alarm.dto.ts
```

### `infra/`

Contém detalhes técnicos.

Deve conter implementações concretas, como:

- Prisma
- Repositórios usando banco de dados
- Serviços externos
- Hash de senha
- JWT

Exemplos futuros:

```txt
infra/database/prisma/prisma.service.ts
infra/database/prisma/prisma.module.ts
infra/repositories/prisma-user.repository.ts
infra/repositories/prisma-alarm.repository.ts
```

### `presentation/`

Contém a entrada HTTP da aplicação.

Deve conter:

- Controllers
- Middlewares
- Guards futuramente
- Pipes futuramente

Os controllers devem apenas receber a requisição, chamar o caso de uso e devolver a resposta.

Não colocar regra de negócio diretamente nos controllers.

## Prisma

### `schema.prisma`

No Prisma 7, o datasource não deve conter `url = env("DATABASE_URL")`.

Exemplo esperado:

```prisma
generator client {
  provider     = "prisma-client"
  output       = "../src/generated/prisma"
  moduleFormat = "cjs"
}

datasource db {
  provider = "postgresql"
}
```

A URL do banco deve ficar em `prisma.config.ts`.

### `prisma.config.ts`

Exemplo esperado:

```ts
import "dotenv/config"
import { defineConfig, env } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
})
```

## PrismaService

O `PrismaService` deve ficar em:

```txt
src/infra/database/prisma/prisma.service.ts
```

Exemplo:

```ts
import { Injectable, OnModuleInit } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../../generated/prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
    })

    super({ adapter })
  }

  async onModuleInit() {
    await this.$connect()
  }
}
```

## PrismaModule

O `PrismaModule` deve ficar em:

```txt
src/infra/database/prisma/prisma.module.ts
```

Exemplo:

```ts
import { Global, Module } from '@nestjs/common'
import { PrismaService } from './prisma.service'

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

O `AppModule` deve importar o `PrismaModule`.

## Variáveis de ambiente

O arquivo `.env` real não deve subir para o GitHub.

O `.env.example` deve subir com valores genéricos.

Exemplo de `.env.example`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/database?schema=public"

POSTGRES_USER="user"
POSTGRES_PASSWORD="password"
POSTGRES_DB="database"
POSTGRES_PORT="5432"
```

## Docker

O arquivo `docker-compose.yml` real não deve subir para o GitHub.

Deve subir apenas o `docker-compose.example.yml`.

Exemplo:

```yml
services:
  postgres:
    image: postgres:16
    container_name: proxalert_postgres
    restart: always
    ports:
      - "${POSTGRES_PORT}:5432"
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Modelos iniciais sugeridos

### User

Responsável por representar o usuário do app.

Campos iniciais sugeridos:

```prisma
model User {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  password  String
  plan      Plan     @default(FREE)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Plan {
  FREE
  PREMIUM
}
```

### Alarm

Responsável por representar um alarme de proximidade.

Ideia de regra:

- Usuário do plano gratuito pode ter até 3 alarmes salvos.
- O limite deve considerar alarmes criados/salvos, não apenas alarmes ativos.
- Isso evita que o usuário crie alarmes ilimitados e apenas ative/desative.

Campos futuros sugeridos:

```prisma
model Alarm {
  id          String   @id @default(uuid())
  title       String
  latitude    Float
  longitude   Float
  radius      Int
  isActive    Boolean  @default(true)
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

Quando adicionar `Alarm`, o `User` deverá ter:

```prisma
alarms Alarm[]
```

## Regras importantes do produto

### Plano gratuito

O plano gratuito deve limitar a quantidade de alarmes salvos.

Regra sugerida:

```txt
Usuários FREE podem ter até 3 alarmes salvos.
```


### Plano premium

- Mais alarmes salvos
- Alarmes ilimitados
- Mais personalização
- Compartilhamento avançado
- Sem anuncios

## Convenções de código

- Usar TypeScript.
- Evitar regra de negócio em controllers.
- Preferir entidades no domínio para validações principais.
- Preferir use cases para coordenar ações da aplicação.
- Preferir interfaces de repositório no domínio.
- Implementações com Prisma devem ficar em `infra/repositories`.
- O domínio não deve importar Prisma.
- O domínio não deve importar NestJS.
- O controller não deve chamar Prisma diretamente.

Fluxo esperado:

```txt
Controller
  ↓
 Zod
  ↓
Use Case
  ↓
Repository Interface
  ↓
Prisma Repository
  ↓
PrismaService
  ↓
PostgreSQL
```

## Próximas tarefas sugeridas

1. Organizar a estrutura de pastas.
2. Criar `BusinessError` em `domain/errors`.
3. Criar entidade `User` em `domain/entities`.
4. Criar interface `IUserRepository` em `domain/repositories`.
5. Criar `PrismaUserRepository` em `infra/repositories`.
6. Criar `CreateUserUseCase` em `application/use-cases/users`.
7. Criar `UserController` em `presentation/http/controllers`.
8. Criar módulo de usuário no NestJS.
9. Adicionar hash de senha com bcrypt.
10. Adicionar autenticação JWT.
11. Criar entidade e fluxo de `Alarm`.
12. Aplicar limite de 5 alarmes salvos para usuários FREE.

## Observações para assistentes de IA

Ao sugerir alterações neste projeto:

- Respeite a arquitetura em camadas.
- Não coloque Prisma dentro do domínio.
- Não coloque regra de negócio diretamente no controller.
- Não sugira subir `.env` ou `docker-compose.yml` real para o GitHub.
- Considere que o projeto usa Prisma 7.
- Considere que o Prisma Client é gerado em `src/generated/prisma`.
- Considere que o generator usa `moduleFormat = "cjs"` para evitar conflito com CommonJS/ESM no NestJS.
- Prefira respostas didáticas e com comandos claros.
- Em duvidas perguntar antes de executar.