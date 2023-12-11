### Iniciar o projeto
Utilize o VSCode e o DevContainer para iniciar o projeto. Isso iniciará o projeto em um contêiner Docker com todas as dependências instaladas.

### Copiar e ajustar o arquivo .env para a sua plataforma

```bash
cp .env.example .env
```
Edite JAVA_TARGETPLATFORM e MYSQL_TARGETPLATFORM

### Executar a API
Para executar a API, utilize o seguinte comando:

```bash
gradle bootRun
```
