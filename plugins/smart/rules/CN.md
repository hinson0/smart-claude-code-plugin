# rules（中文汇总）

> 本文件是 `plugins/smart/rules/` 下各规则文档的中文汇总，仅供阅读参考。被加载执行的是同目录的英文版本。


---

# fastapi

# FastAPI 开发规则（现代语法 · 2026）

本规则适用于 FastAPI ≥ 0.115.x 项目，结合 Python 3.14 特性，强调依赖注入、类型安全与可维护性。所有端点、依赖项、中间件必须遵循以下约定。

---

## 一、依赖注入

### 1. 核心原则

- **Depends 是标记器**，FastAPI 自动解析依赖树；同一请求内相同依赖默认只执行一次（缓存返回值）。
- 依赖项可以是函数、生成器、类实例（`__call__`）等任意可调用对象。
- 依赖注入应保持纯净：**只做协议转换 / 验证 / 资源管理**，不要在依赖中嵌入业务逻辑。

### 2. 类型注解现代化

**必须**使用 `Annotated` 封装依赖别名，严禁在路径操作函数参数中使用 `Depends(...)` 作为默认值：

```python
# ❌ 旧式（禁止）
async def route(db: Session = Depends(get_db)):
    ...

# ✅ 现代
from typing import Annotated
from fastapi import Depends

DbDep = Annotated[AsyncSession, Depends(get_db)]
CurrentUserDep = Annotated[User, Depends(get_current_user)]

async def route(db: DbDep, user: CurrentUserDep):
    ...
```

**命名约定：**
- 别名以 `Dep` 结尾（`DbDep`、`CurrentUserDep`、`TokenDep`、`SettingsDep`）
- 统一放入 `app/deps.py` 或模块级 `deps.py`，避免散落
- 可组合：`AdminUserDep = Annotated[User, Depends(require_admin)]`

**与 `Query`/`Path`/`Header`/`Body`/`Form` 结合时，元数据放入 `Annotated`：**

```python
PageDep = Annotated[int, Query(ge=1, le=1000)]
ItemIdDep = Annotated[int, Path(ge=1)]
AuthHeaderDep = Annotated[str, Header(alias="X-Auth-Token")]

async def list_items(page: PageDep = 1, token: AuthHeaderDep): ...
```

### 3. 资源生命周期管理（yield 依赖）

管理数据库连接、文件句柄等使用 `yield` 生成器依赖：

```python
from collections.abc import AsyncGenerator

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
```

- **禁止**在 `yield` 依赖上设置 `use_cache=False`，会导致资源泄漏。
- `yield` 之后的代码在响应发出**之后**执行，不能通过 `HTTPException` 修改响应。
- 推荐使用 `async with` 上下文管理器自动清理，标准写法同上。

### 4. 灵活依赖控制（dependencies 参数）

使用 `dependencies` 参数在三个级别注册"只执行不注入返回值"的依赖：

| 级别 | 语法示例 | 典型场景 |
|------|---------|---------|
| 路径 | `@app.get("/items", dependencies=[Depends(verify_token)])` | 单接口鉴权 |
| 路由 | `router = APIRouter(dependencies=[Depends(verify_token)])` | 模块级认证 |
| 全局 | `app = FastAPI(dependencies=[Depends(log_request)])` | 全站日志、API Key 校验 |

**执行顺序：** 全局 → 路由 → 路径 → 参数；同级别按列表顺序执行。

### 5. 缓存控制（use_cache）

同一请求内，默认缓存依赖返回值。如需每次重新执行（如时间戳、UUID），在别名中封装：

```python
TimestampDep = Annotated[float, Depends(get_timestamp, use_cache=False)]
```

不要在端点中散落 `use_cache` 配置。

### 6. 类作为依赖项（参数化依赖）

使用 `__call__` 方法实现参数化类依赖：
- `__init__` 接收**配置参数**（如权限等级、限流阈值）
- `__call__` 接收 **HTTP 请求参数**（`Query`、`Header` 等），执行业务逻辑

```python
from fastapi import HTTPException

class PermissionChecker:
    def __init__(self, required_role: str) -> None:
        self.required_role = required_role

    def __call__(
        self,
        user: Annotated[User, Depends(get_current_user)],
    ) -> User:
        if user.role != self.required_role:
            raise HTTPException(403, "权限不足")
        return user

require_admin = PermissionChecker("admin")
require_editor = PermissionChecker("editor")

AdminUserDep = Annotated[User, Depends(require_admin)]

@app.get("/admin")
async def admin_panel(user: AdminUserDep):
    ...
```

**禁止**在 `__init__` 中直接使用 `Query()`、`Body()` 等 FastAPI 参数，避免 HTTP 细节污染业务类。

### 7. 嵌套依赖

依赖可以通过参数引用其他依赖，FastAPI 自动解析顺序与缓存：

```python
async def get_token(auth: Annotated[str, Header()]) -> str:
    if not auth.startswith("Bearer "):
        raise HTTPException(401)
    return auth[7:]

async def get_current_user(
    token: Annotated[str, Depends(get_token)],
    db: DbDep,
) -> User:
    user = await db.get(User, decode_jwt(token)["sub"])
    if user is None:
        raise HTTPException(401)
    return user
```

依赖链应保持清晰层次：**协议解析 → 数据查询 → 权限校验 → 业务函数**。

---

## 二、路由组织（APIRouter）

### 1. 模块化路由

将相关端点组织到 `APIRouter`，使用 `prefix`、`tags`、`dependencies` 统一配置：

```python
# app/routers/users.py
from fastapi import APIRouter

router = APIRouter(
    prefix="/users",
    tags=["users"],
    dependencies=[Depends(verify_token)],
    responses={401: {"description": "未授权"}, 404: {"description": "未找到"}},
)

@router.get("/{user_id}")
async def get_user(user_id: int, db: DbDep) -> UserOut:
    ...

# app/main.py
from app.routers import users, items
app.include_router(users.router)
app.include_router(items.router, prefix="/api/v1")
```

### 2. 路由命名约定

- 文件名：`app/routers/<resource>.py`（`users.py`、`items.py`、`auth.py`）
- 每个模块导出 `router = APIRouter(...)`
- **禁止**在 `main.py` 中定义业务端点——只负责应用装配与 router 注册

---

## 三、路径操作与请求处理

### 1. 路径参数

使用 `Annotated` 结合 `Path` 声明验证规则：

```python
@app.get("/items/{item_id}")
async def read_item(item_id: Annotated[int, Path(ge=1, le=1_000_000)]):
    ...
```

### 2. 查询参数

```python
# 必填
name: Annotated[str, Query(min_length=1, max_length=100)]

# 可选
keyword: Annotated[str | None, Query()] = None

# 带默认值
limit: Annotated[int, Query(ge=1, le=100)] = 20

# 列表
tags: Annotated[list[str], Query()] = []
```

### 3. 请求体与响应模型

使用 Pydantic 模型作为请求/响应类型：

```python
@router.post("/", response_model=UserOut, status_code=201)
async def create_user(payload: UserCreate, db: DbDep) -> User:
    user = User(**payload.model_dump())
    db.add(user)
    await db.flush()
    return user
```

**返回类型注解**（`-> User`）用于类型检查；**`response_model`**（`UserOut`）用于序列化与过滤。两者可不同——ORM 对象进，Pydantic 模型出，FastAPI 自动转换。

### 4. 响应配置

```python
@router.get(
    "/items/{item_id}",
    response_model=ItemOut,
    response_model_exclude_unset=True,   # 跳过未显式设置的字段
    response_model_exclude_none=True,    # 跳过 None 字段
    status_code=200,
    summary="获取单个 Item",
    description="按 ID 获取 Item 详情",
    responses={404: {"model": ErrorResponse}},
    deprecated=False,
)
async def get_item(item_id: int): ...
```

### 5. 表单与文件

```python
from fastapi import Form, UploadFile, File

@router.post("/upload")
async def upload(
    description: Annotated[str, Form()],
    file: Annotated[UploadFile, File()],
):
    contents = await file.read()
    ...
```

### 6. Request 对象

当需要访问原始 ASGI 信息或 `request.state` 时，直接注入 `Request`：

```python
from fastapi import Request

@router.get("/ip")
async def get_ip(request: Request) -> dict[str, str | None]:
    return {"ip": request.client.host if request.client else None}
```

**注意：** `request.client` 返回 `Address(host, port)` 对象或 `None`，并非元组。

### 7. 后台任务（BackgroundTasks）

轻量级后台工作（发邮件、写日志）使用 `BackgroundTasks`：

```python
from fastapi import BackgroundTasks

@router.post("/notify")
async def notify(payload: NotifyIn, tasks: BackgroundTasks) -> dict[str, str]:
    tasks.add_task(send_email, payload.to, payload.subject, payload.body)
    return {"status": "queued"}
```

**后台任务在响应发出后执行**，不影响响应时间。复杂任务应使用 Celery / ARQ / Dramatiq 等专业队列。

### 8. 流式响应

大数据或实时流使用 `StreamingResponse`：

```python
from fastapi.responses import StreamingResponse

@router.get("/export")
async def export_csv():
    async def generate() -> AsyncGenerator[bytes, None]:
        yield b"id,name\n"
        async for row in db.stream(select(Item)):
            yield f"{row.id},{row.name}\n".encode()

    return StreamingResponse(generate(), media_type="text/csv")
```

Server-Sent Events 使用 `media_type="text/event-stream"`。

### 9. WebSocket

```python
from fastapi import WebSocket, WebSocketDisconnect

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket) -> None:
    await ws.accept()
    try:
        while True:
            data = await ws.receive_text()
            await ws.send_text(f"echo: {data}")
    except WebSocketDisconnect:
        logger.info("client disconnected")
```

WebSocket 中不能使用标准 `HTTPException`，应使用 `WebSocketException` 或 `ws.close(code=1008)`。

### 10. 中间件

```python
from typing import Awaitable, Callable
from fastapi import Request, Response

@app.middleware("http")
async def request_id_middleware(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    request.state.request_id = uuid4().hex
    response = await call_next(request)
    response.headers["X-Request-ID"] = request.state.request_id
    return response
```

**内置中间件**（通过 `app.add_middleware()` 注册）：

```python
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://example.com"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["example.com", "*.example.com"])
```

**中间件执行顺序：后注册先执行**（栈式）——调试时注意。

### 11. 异常处理

使用 `HTTPException` 返回标准错误；自定义异常通过 `@app.exception_handler` 注册：

```python
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse

class BusinessError(Exception):
    def __init__(self, code: str, message: str) -> None:
        self.code = code
        self.message = message

@app.exception_handler(BusinessError)
async def business_error_handler(request: Request, exc: BusinessError) -> JSONResponse:
    return JSONResponse(
        status_code=400,
        content={"code": exc.code, "message": exc.message},
    )
```

覆盖默认验证错误响应：

```python
from fastapi.exceptions import RequestValidationError

@app.exception_handler(RequestValidationError)
async def validation_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={"code": "VALIDATION_ERROR", "errors": exc.errors()},
    )
```

---

## 四、应用配置

### 1. 生命周期事件

`@app.on_event("startup")` / `"shutdown"` **已废弃**，使用 `lifespan` 异步上下文管理器：

```python
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # 启动
    app.state.db_engine = create_async_engine(settings.database_url)
    await init_db(app.state.db_engine)
    yield
    # 关闭
    await app.state.db_engine.dispose()

app = FastAPI(lifespan=lifespan)
```

生命周期中创建的资源可挂到 `app.state`，端点通过 `request.app.state` 访问。

### 2. 配置管理（pydantic-settings）

```python
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    database_url: str
    secret_key: str
    debug: bool = False

@lru_cache
def get_settings() -> Settings:
    return Settings()

SettingsDep = Annotated[Settings, Depends(get_settings)]
```

- `@lru_cache` 确保单例加载，避免每次请求读环境变量。
- 通过 `SettingsDep` 注入到端点，**禁止**在模块顶层直接读取 `os.environ`。

### 3. OpenAPI 元信息

```python
app = FastAPI(
    title="My API",
    version="1.0.0",
    description="...",
    openapi_tags=[
        {"name": "users", "description": "用户相关操作"},
        {"name": "items", "description": "Item 操作"},
    ],
    docs_url="/docs" if settings.debug else None,
    redoc_url=None,
)
```

生产环境建议关闭 `/docs` 与 `/redoc`，或通过认证路由保护。

---

## 五、测试

### 1. 依赖覆盖（dependency_overrides）

测试时使用 `app.dependency_overrides` 替换真实依赖：

```python
from fastapi.testclient import TestClient

def get_test_db():
    return MockSession()

app.dependency_overrides[get_db] = get_test_db

client = TestClient(app)

def test_list_users():
    response = client.get("/users")
    assert response.status_code == 200
    app.dependency_overrides.clear()  # 测试后清理
```

推荐用 pytest fixture + `yield` 自动清理。

### 2. 异步测试

使用 `httpx.AsyncClient` + `pytest-asyncio`：

```python
import pytest
from httpx import AsyncClient, ASGITransport

@pytest.mark.asyncio
async def test_async_route():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/items")
    assert response.status_code == 200
```

---

## 六、安全

### 1. OAuth2 Password Bearer

```python
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")
TokenDep = Annotated[str, Depends(oauth2_scheme)]

async def get_current_user(token: TokenDep, db: DbDep) -> User:
    ...
```

### 2. API Key（Header / Query / Cookie）

```python
from fastapi.security import APIKeyHeader

api_key_header = APIKeyHeader(name="X-API-Key")
ApiKeyDep = Annotated[str, Depends(api_key_header)]
```

### 3. 范围（Scopes）与 `Security()`

使用 `Security()` 替代 `Depends()` 以支持 OAuth2 scopes：

```python
from fastapi import Security
from fastapi.security import SecurityScopes

async def require_scopes(
    security_scopes: SecurityScopes,
    token: TokenDep,
) -> User:
    # 校验 token 中包含 security_scopes.scopes 要求的范围
    ...

@router.get("/admin", dependencies=[Security(require_scopes, scopes=["admin"])])
async def admin(): ...
```

---

## 七、性能与响应

- 默认启用 `response_model`，利用 Pydantic 过滤/序列化响应，避免手动转换。
- IO 密集操作使用 `async def` + `await`；CPU 密集任务放入线程池或独立进程。
- **禁止**在 `async def` 内调用阻塞 IO（`requests.get`、`time.sleep`、同步数据库驱动）——会阻塞事件循环。
- 大文件下载使用 `StreamingResponse` 或 `FileResponse`，避免一次性读入内存。
- 启用 `GZipMiddleware` 压缩响应；对高频静态响应配置 `Cache-Control`。

---

## 八、禁止事项

| 禁止 | 替代方案 |
|------|---------|
| 参数使用 `= Depends(...)` 默认值 | `Annotated[T, Depends(...)]` 别名 |
| `yield` 依赖设置 `use_cache=False` | 默认缓存，依赖 `async with` 清理 |
| 类依赖 `__init__` 使用 `Query()` / `Body()` | 放入 `__call__` |
| `@app.on_event("startup")` / `"shutdown")` | `lifespan` 异步上下文管理器 |
| 模块顶层读 `os.environ` | `BaseSettings` + `@lru_cache` 依赖注入 |
| 返回原始 ORM 对象无 `response_model` | 显式 `response_model` 控制序列化 |
| `async def` 中调用阻塞 IO | 改用异步库或 `run_in_executor` |
| 在 `main.py` 定义业务端点 | 拆分到 `APIRouter` |
| WebSocket 中 `raise HTTPException` | `WebSocketException` / `ws.close()` |
| 测试时手动 mock 全局状态 | `app.dependency_overrides` |

---

## 九、推荐实践

- **项目结构**：
  ```
  app/
  ├── main.py           # 装配 app + lifespan
  ├── deps.py           # 统一 Annotated 依赖别名
  ├── config.py         # Settings + get_settings
  ├── routers/          # APIRouter 模块
  ├── schemas/          # Pydantic 模型
  ├── models/           # SQLAlchemy 等 ORM 模型
  ├── services/         # 业务逻辑
  └── tests/
  ```
- 所有端点必须声明 `response_model` 或返回类型注解，保证 OpenAPI 文档完整。
- 异常统一抛出自定义业务异常，全局 handler 转换为标准错误响应。
- 启用 `pyright --strict` 或 `mypy --strict` 检查类型覆盖。

---

遵循以上规则可确保 FastAPI 项目类型安全、可测试、可维护，并充分利用现代 Python 与 FastAPI 的特性。


---

# pydantic-v2

# Pydantic V2 开发规则

本规则适用于 Pydantic V2（≥ 2.5.x）项目，结合 Python 3.10+ 特性，强调类型安全、校验严格性与序列化控制。所有模型、校验器、设置类必须遵循以下约定。

---

## 一、模型定义

### 1. 声明方式

使用 `BaseModel` 创建模型，所有配置放入 `model_config` 中，使用 `ConfigDict`：

```python
from pydantic import BaseModel, ConfigDict

class User(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        validate_assignment=True,
        str_strip_whitespace=True,
    )

    name: str
    age: int | None = None
```

- **禁止** V1 的 `class Config` 内部类。
- **禁止** `from_orm()`、`dict()`、`parse_obj()` 等 V1 方法。
- 字段类型必须使用 Python 3.10+ 内置泛型（`list[int]`、`str | None`），**禁止** `typing.List`、`typing.Optional`。

### 2. 常用 `ConfigDict` 参数

| 配置项 | 用途 | 推荐 |
|--------|------|------|
| `from_attributes` | 允许从 ORM / 任意对象属性构建（替代 V1 `orm_mode`） | ORM 模型设 `True` |
| `validate_assignment` | 字段赋值时重新校验 | 可变模型推荐开 |
| `extra` | `'ignore'`（默认）/ `'forbid'` / `'allow'` | API 入参用 `'forbid'` |
| `str_strip_whitespace` | 自动去除字符串前后空白 | API 入参推荐开 |
| `validate_default` | 默认值是否走校验器 | 严格场景开 |
| `populate_by_name` | 允许同时用字段名和 alias 填值 | 与 alias 配合 |
| `frozen` | 实例不可变（可哈希） | 值对象推荐 |
| `arbitrary_types_allowed` | 允许非 Pydantic 类型作字段 | 谨慎使用 |
| `revalidate_instances` | `'never'` / `'always'` / `'subclass-instances'` | 继承场景用 `'always'` |

**性能提示：** `validate_assignment` 全局开启会在每次字段赋值触发完整校验，对高频修改的模型影响明显；仅在确实需要赋值守卫的模型上开。

### 3. `Field()` 与约束

使用 `Field()` 声明默认值、约束和元数据：

```python
from pydantic import BaseModel, Field

class Product(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    price: float = Field(gt=0, le=1_000_000, description="含税价")
    tags: list[str] = Field(default_factory=list, max_length=20)
    slug: str = Field(pattern=r"^[a-z0-9-]+$")
    rating: int = Field(ge=0, le=5)
```

**常用约束速查：**

| 类型 | 约束 |
|------|------|
| 数值 | `gt`, `ge`, `lt`, `le`, `multiple_of` |
| 字符串 | `min_length`, `max_length`, `pattern` |
| 集合 | `min_length`, `max_length` |
| 小数 | `max_digits`, `decimal_places` |

**默认值的陷阱：** 可变默认值**必须**使用 `Field(default_factory=list)`，**禁止** `Field(default=[])`（Pydantic V2 会报错）。

### 4. 别名（Alias）

处理 camelCase API / 多源数据：

```python
from pydantic import BaseModel, Field, AliasChoices, AliasPath

class User(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    user_id: int = Field(alias="userId")
    email: str = Field(
        validation_alias=AliasChoices("email", "emailAddress", "mail"),
    )
    city: str = Field(validation_alias=AliasPath("address", "city"))
    display_name: str = Field(serialization_alias="displayName")
```

- `validation_alias`：输入时接受哪些名字
- `serialization_alias`：输出时用哪个名字
- `AliasChoices`：多个候选名字（按顺序匹配）
- `AliasPath`：从嵌套路径取值（`{"address": {"city": "北京"}}`）
- `populate_by_name=True`：允许同时用字段名和 alias

### 5. 判别联合（Discriminated Unions）

多态模型用 `discriminator` 实现 O(1) 验证与精准错误定位：

```python
from typing import Literal
from pydantic import BaseModel, Field

class Cat(BaseModel):
    kind: Literal["cat"]
    meow_volume: int

class Dog(BaseModel):
    kind: Literal["dog"]
    bark_loudness: int

class Pet(BaseModel):
    animal: Cat | Dog = Field(discriminator="kind")

Pet.model_validate({"animal": {"kind": "cat", "meow_volume": 5}})
```

**禁止** 对多态场景使用普通 `Union` 无判别字段——Pydantic 会按顺序尝试每个分支，错误信息含糊且性能差。

### 6. 计算字段（Computed Fields）

从其他字段派生的只读属性使用 `@computed_field`，自动出现在序列化输出中：

```python
from pydantic import BaseModel, computed_field

class Rectangle(BaseModel):
    width: float
    height: float

    @computed_field
    @property
    def area(self) -> float:
        return self.width * self.height

Rectangle(width=3, height=4).model_dump()
# {"width": 3.0, "height": 4.0, "area": 12.0}
```

### 7. 泛型模型（PEP 695 语法）

```python
from pydantic import BaseModel

class Page[T](BaseModel):
    items: list[T]
    total: int
    page: int

class User(BaseModel):
    id: int
    name: str

user_page = Page[User].model_validate({
    "items": [{"id": 1, "name": "alice"}],
    "total": 1,
    "page": 1,
})
```

### 8. `RootModel`（集合作为根）

当根结构是列表/字典（无包装对象）时使用 `RootModel`：

```python
from pydantic import RootModel

class UserList(RootModel[list[User]]):
    pass

users = UserList.model_validate([{"id": 1, "name": "alice"}])
for u in users.root:
    print(u.name)
```

**禁止** 用 `BaseModel` 加 `items: list[User]` 字段来包装——会引入多余层级。

---

## 二、校验器

### 1. 字段校验器（`field_validator`）

```python
from pydantic import BaseModel, field_validator

class User(BaseModel):
    username: str
    email: str

    @field_validator("username", mode="after")
    @classmethod
    def check_username(cls, v: str) -> str:
        if len(v) < 3:
            raise ValueError("用户名至少 3 个字符")
        return v.lower()
```

**`mode` 三值对比：**

| mode | 输入 | 典型用途 |
|------|------|---------|
| `"before"` | 原始输入（类型转换**前**） | 规范化、宽容转换 |
| `"after"`（默认） | 已转换后的值 | 业务校验 |
| `"wrap"` | `(cls, value, handler)` | 完全接管，可在 handler 前后插逻辑 |

**多字段共用校验器：**

```python
@field_validator("name", "title", mode="after")
@classmethod
def strip_and_check(cls, v: str) -> str:
    v = v.strip()
    if not v:
        raise ValueError("不能为空")
    return v
```

### 2. 模型校验器（`model_validator`）

跨字段校验使用 `model_validator`：

```python
from typing import Self
from pydantic import BaseModel, model_validator

class SignUp(BaseModel):
    password: str
    confirm_password: str

    @model_validator(mode="after")
    def verify_password_match(self) -> Self:
        if self.password != self.confirm_password:
            raise ValueError("两次密码不一致")
        return self
```

**注意：** `mode="after"` 下校验器接收 `self`（模型实例），**不需要** `@classmethod`；`mode="before"` 接收字典，**必须** `@classmethod`。

### 3. 校验器纯净原则

**禁止**在校验器中执行：
- 数据库查询 / HTTP 请求（阻塞 + 副作用）
- 日志写入 / 消息发送
- 修改外部状态

外部资源相关的校验放在依赖注入层或服务层，校验器**只做纯函数**的规范化和约束。

### 4. `Annotated` 重用校验约束

多处复用的验证逻辑提取为 `Annotated` 类型：

```python
from typing import Annotated
from pydantic import AfterValidator, BeforeValidator

def _strip(v: str) -> str:
    return v.strip()

def _check_not_empty(v: str) -> str:
    if not v:
        raise ValueError("不能为空")
    return v

TrimmedStr = Annotated[str, BeforeValidator(_strip), AfterValidator(_check_not_empty)]

class Post(BaseModel):
    title: TrimmedStr
    summary: TrimmedStr
```

---

## 三、序列化

### 1. `model_dump` vs `model_dump_json`

```python
user.model_dump()                      # dict
user.model_dump(exclude={"password"})  # 排除字段
user.model_dump(exclude_unset=True)    # 跳过未显式设置
user.model_dump(exclude_none=True)     # 跳过 None
user.model_dump(by_alias=True)         # 使用 serialization_alias

user.model_dump_json()                 # str（比 json.dumps(model_dump()) 更快）
user.model_dump_json(indent=2)
```

**性能：** 输出 JSON 时直接用 `model_dump_json()`，**禁止** `json.dumps(model.model_dump())`——后者多一次 Python 层往返。

### 2. 自定义序列化器

**字段级（`field_serializer`）：**

```python
from datetime import datetime
from pydantic import BaseModel, field_serializer

class Event(BaseModel):
    name: str
    timestamp: datetime

    @field_serializer("timestamp")
    def serialize_timestamp(self, v: datetime) -> str:
        return v.isoformat()
```

**模型级（`model_serializer`）：**

```python
from pydantic import model_serializer

class Point(BaseModel):
    x: float
    y: float

    @model_serializer
    def serialize(self) -> list[float]:
        return [self.x, self.y]
```

### 3. `SecretStr` / `SecretBytes`

敏感字段使用 `SecretStr`，防止日志/序列化意外泄漏：

```python
from pydantic import BaseModel, SecretStr

class Credentials(BaseModel):
    username: str
    password: SecretStr

creds = Credentials(username="u", password="p@ss")
print(creds)                    # username='u' password=SecretStr('**********')
creds.model_dump()              # {"username": "u", "password": SecretStr("**********")}
creds.password.get_secret_value()  # 'p@ss' — 必须显式获取
```

---

## 四、反序列化与 `TypeAdapter`

### 1. `model_validate` vs `model_validate_json`

```python
User.model_validate({"name": "alice", "age": 30})        # dict
User.model_validate_json('{"name":"alice","age":30}')    # JSON 字符串（更快）
User.model_validate(orm_user)                            # ORM 对象（需 from_attributes=True）
```

**性能：** 从字符串解析时用 `model_validate_json()`，比 `json.loads` + `model_validate` 快 2-3×——V2 内部绕过 Python dict 直接走 Rust 解析器。

### 2. `TypeAdapter`（无需 BaseModel 的校验）

对任意类型进行校验/序列化，而不定义模型：

```python
from typing import Annotated
from pydantic import TypeAdapter, Field

# 校验原生类型
IntList = TypeAdapter(list[int])
IntList.validate_python([1, 2, 3])
IntList.validate_json("[1,2,3]")

# 带约束
PositiveIntList = TypeAdapter(list[Annotated[int, Field(gt=0)]])
PositiveIntList.validate_python([1, 2, 3])      # ✅
PositiveIntList.validate_python([1, -1, 3])     # ❌ ValidationError

# 复杂嵌套
Config = TypeAdapter(dict[str, list[int]])
Config.validate_python({"a": [1, 2], "b": [3, 4]})
```

`TypeAdapter` 应**实例化一次**并复用（内部缓存编译结果），**禁止**在请求路径上重复 `TypeAdapter(...)`。

---

## 五、`pydantic-settings`

### 1. 基础配置

```python
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, SecretStr

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_prefix="APP_",            # APP_DATABASE_URL 映射到 database_url
        case_sensitive=False,
        extra="ignore",
    )

    database_url: str
    secret_key: SecretStr
    debug: bool = False
    allowed_origins: list[str] = Field(default_factory=list)
```

### 2. 嵌套配置

```python
class DbSettings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="DB_")
    host: str
    port: int = 5432
    user: str
    password: SecretStr

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_nested_delimiter="__")
    debug: bool = False
    db: DbSettings  # 通过 DB__HOST, DB__PORT 等注入，或 APP_DB__HOST
```

### 3. 单例模式

配合 `@lru_cache` 确保全局单例，避免每次读环境变量：

```python
from functools import lru_cache

@lru_cache
def get_settings() -> Settings:
    return Settings()
```

**禁止**在模块顶层直接 `settings = Settings()` ——测试时无法替换。

### 4. 必填字段处理

类型检查器无法识别 env 自动注入，因此**必填**字段有两种写法：

```python
# 写法 A：无默认值（pyright 报错但运行时正确）
database_url: str

# 写法 B：空字符串 + 校验器（类型检查友好）
database_url: str = ""

@field_validator("database_url")
@classmethod
def check_not_empty(cls, v: str) -> str:
    if not v:
        raise ValueError("DATABASE_URL 必须设置")
    return v
```

---

## 六、测试

### 1. `model_construct`（跳过校验的快速构造）

在 fixture 和测试中构造对象时，若输入已被信任，使用 `model_construct()` 绕过校验：

```python
user = User.model_construct(id=1, name="alice", created_at=datetime.now())
```

**仅在测试/内部代码中使用**，生产代码必须用 `model_validate()` 或构造器。

### 2. 部分模型（测试时）

```python
def make_user(**overrides) -> User:
    defaults = {"id": 1, "name": "alice", "email": "a@x.com"}
    return User(**(defaults | overrides))

def test_user_validation():
    user = make_user(name="bob")
    assert user.name == "bob"
```

---

## 七、V1 → V2 迁移速查

| V1 | V2 |
|----|----|
| `class Config:` | `model_config = ConfigDict(...)` |
| `orm_mode = True` | `from_attributes=True` |
| `allow_population_by_field_name` | `populate_by_name` |
| `.dict()` | `.model_dump()` |
| `.json()` | `.model_dump_json()` |
| `.parse_obj()` | `.model_validate()` |
| `.parse_raw()` | `.model_validate_json()` |
| `.from_orm()` | `.model_validate(obj)`（需 `from_attributes=True`） |
| `@validator` | `@field_validator` + `@classmethod` |
| `@root_validator` | `@model_validator` |
| `Config.schema_extra` | `model_config = {"json_schema_extra": ...}` |
| `Field(const=True)` | `Literal[value]` 或 `Field(frozen=True)` |

---

## 八、禁止事项

| 禁止 | 替代 |
|------|------|
| `class Config:` 内部类 | `model_config = ConfigDict(...)` |
| `from_orm()` / `dict()` / `parse_obj()` | `model_validate()` / `model_dump()` |
| `typing.List`、`typing.Optional` | `list`、`X \| None` |
| `Union[A, B]` 多态场景无 `discriminator` | `Field(discriminator=...)` |
| `Field(default=[])` 可变默认 | `Field(default_factory=list)` |
| 校验器忘记 `@classmethod`（`before`/`wrap` 模式） | 必须加 `@classmethod` |
| 校验器内副作用（DB / HTTP） | 外部逻辑放服务层 |
| `json.dumps(m.model_dump())` | `m.model_dump_json()` |
| `json.loads(s)` + `model_validate(...)` | `model_validate_json(s)` |
| `BaseModel` 包装根列表 | `RootModel[list[T]]` |
| 请求路径重复 `TypeAdapter(T)` | 模块级实例化一次复用 |
| 明文存储密码/密钥字段 | `SecretStr` |
| 模块顶层实例化 `Settings()` | `@lru_cache` + `get_settings()` |

---

## 九、性能与最佳实践

- **快速路径**：JSON 输入优先 `model_validate_json`；JSON 输出优先 `model_dump_json`。
- **避免热路径开销**：`validate_assignment` 按需开启；`revalidate_instances="always"` 仅在继承复杂时使用。
- **批量校验**：`TypeAdapter(list[User]).validate_python(rows)` 比循环单个 `model_validate` 快。
- **OpenAPI / JSON Schema**：通过 `Model.model_json_schema()` 获取 schema，`Field(description=...)` 与 `json_schema_extra` 丰富文档。
- **向前兼容**：在模型上同时使用 `validation_alias`（接受旧字段名）和 `serialization_alias`（输出新字段名），实现平滑迁移。

---

## 十、通用原则

- 面向 Python 3.10+，使用 `X | Y` 联合类型与 PEP 695 泛型语法。
- 字段名遵循 `snake_case`；对接 camelCase 时用 `alias`，不要在代码里直接写 camelCase。
- **输入模型**（API 入参）推荐 `extra="forbid"` + `str_strip_whitespace=True`。
- **输出模型**（API 响应）独立定义，不直接复用 ORM 映射的内部模型——防止内部字段泄漏。
- 与 SQLAlchemy 协作时，在独立的 `schemas/` 模块管理 Pydantic 模型，与 `models/` 中 ORM 模型解耦。

---

遵循以上规则可保证 Pydantic V2 代码类型安全、校验严格、性能优异，并为 FastAPI / 数据管道等场景提供稳固基础。


---

# python-3.14

# Python 3.14 开发规则

本规则适用于 Python 3.14 项目，强制使用最新的语法、标准库特性及类型注解规范。所有生成的代码必须严格遵循以下约定。

---

## 一、类型注解

### 1. 延迟求值（PEP 649 & 749）

Python 3.14 原生实现注解延迟求值——注解不再在定义时立即执行，而是按需求值。

- **禁止** `from __future__ import annotations`，Python 3.14 已原生延迟求值所有注解。
- **前向引用**：直接使用当前作用域中尚未定义的类名，无需字符串包裹。

```python
class Node:
    def children(self) -> list[Node]:  # ✅ 直接引用 Node，无需 'Node'
        ...

class Response:
    data: list[Item]        # ✅ 即使 Item 定义在后面也无需字符串
    error: Error | None
```

### 2. 内置泛型

- **联合类型**：使用 `X | Y`，不用 `Union[X, Y]`；使用 `X | None`，不用 `Optional[X]`。
- **泛型容器**：`list[int]`、`dict[str, int]`、`tuple[int, str]`、`set[int]`。**禁止** `typing.List`、`typing.Dict` 等已弃用别名。
- **类型别名**：优先使用 `type` 语句（Python 3.12+）：

```python
type Vector = list[float]
type Matrix = list[Vector]
type JsonValue = str | int | float | bool | None | list[JsonValue] | dict[str, JsonValue]
type Callback[T] = (T) -> None
```

**禁止**普通变量赋值 `Vector = list[float]` 作类型别名（除非兼容旧工具）。

### 3. 泛型类与函数（PEP 695，Python 3.12+）

使用 `[T]` 语法定义泛型，**禁止** 旧的 `TypeVar` 写法：

```python
# ✅ 3.12+ 新语法
class Stack[T]:
    def __init__(self) -> None:
        self._items: list[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> T:
        return self._items.pop()

def first[T](items: list[T]) -> T:
    return items[0]

# 带约束的泛型（T 只能是 int、float 或 str）
def maximum[T: (int, float, str)](a: T, b: T) -> T:
    return a if a > b else b

# 带上界（T 必须是 Comparable 的子类）
class SortedList[T: Comparable]:
    ...
```

**约束 vs 上界：**
- `T: (int, float, str)` — 约束：T 只能**恰好是**这几种类型之一
- `T: Comparable` — 上界：T 必须是 `Comparable` 的子类/子类型

### 4. `@override` 装饰器（PEP 698，Python 3.12+）

在子类中覆盖父类方法时，必须加 `@override`，让静态检查器发现拼写错误或签名不匹配：

```python
from typing import override

class Animal:
    def speak(self) -> str: ...

class Dog(Animal):
    @override
    def speak(self) -> str:  # ✅ 检查器验证父类确有此方法
        return "woof"
```

### 5. `Self` 类型

方法返回自身实例时，使用 `Self` 而非类名，确保子类继承时返回类型正确：

```python
from typing import Self

class Builder:
    def set_name(self, name: str) -> Self:
        self.name = name
        return self

class AdvancedBuilder(Builder):
    def set_level(self, level: int) -> Self:
        self.level = level
        return self

# AdvancedBuilder().set_name("x").set_level(2) 返回 AdvancedBuilder
```

### 6. `Never` 与穷举检查

`assert_never()` 让静态检查器在遗漏分支时报错：

```python
from typing import Literal, Never, assert_never

type Status = Literal["pending", "active", "closed"]

def handle(status: Status) -> str:
    match status:
        case "pending": return "等待中"
        case "active":  return "进行中"
        case "closed":  return "已关闭"
        case _ as unreachable:
            assert_never(unreachable)  # 新增 Status 值未处理时在此编译报错
```

### 7. Literal 类型

使用 `Literal["a", "b"]` 表示有限值集合：

```python
from typing import Literal

type Direction = Literal["north", "south", "east", "west"]
type HttpMethod = Literal["GET", "POST", "PUT", "DELETE", "PATCH"]

def route(method: HttpMethod, path: str) -> None: ...
```

### 8. TypedDict 增强（PEP 655）

```python
from typing import TypedDict, NotRequired, Required

class UserFilter(TypedDict):
    username: str
    email: NotRequired[str]
    page: NotRequired[int]

class Config(TypedDict, total=False):
    host: Required[str]   # total=False 下仍为必填
    port: int
    debug: bool
```

### 9. `assert_type()` 静态验证

在单元测试或关键位置显式验证推断类型：

```python
from typing import assert_type

x = [1, 2, 3]
assert_type(x, list[int])   # 静态检查器验证 x 的推断类型；运行时无开销
```

---

## 二、枚举（`enum`）

### 1. 优先使用 `StrEnum` / `IntEnum`（Python 3.11+）

```python
from enum import StrEnum, IntEnum, auto

class Status(StrEnum):
    PENDING = "pending"
    ACTIVE = "active"
    CLOSED = "closed"

class Priority(IntEnum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3

# StrEnum 实例与字符串互通，JSON 序列化自然
Status.ACTIVE == "active"  # ✅ True
```

**禁止** 混用 `class Color(str, Enum):` 多重继承写法，3.11+ 一律用 `StrEnum`。

### 2. `auto()` 生成值

```python
class Color(StrEnum):
    RED = auto()    # 自动为 "red"
    GREEN = auto()  # 自动为 "green"
    BLUE = auto()   # 自动为 "blue"
```

---

## 三、异步编程

### 1. 入口点

```python
import asyncio

async def main() -> None:
    ...

if __name__ == "__main__":
    asyncio.run(main())
```

**禁止**：
- ❌ `loop = asyncio.get_event_loop()`
- ❌ `loop.run_until_complete(coro)`
- ❌ `asyncio._get_running_loop()`（私有 API）

### 2. 结构化并发（TaskGroup，Python 3.11+）

```python
async def fetch_all(urls: list[str]) -> list[bytes]:
    async with asyncio.TaskGroup() as tg:
        tasks = [tg.create_task(fetch(url)) for url in urls]
    return [task.result() for task in tasks]
```

`TaskGroup` 的优势：任意子任务失败时**自动取消其他任务**，所有异常汇总为 `ExceptionGroup`。推荐作为默认选择，`asyncio.gather()` 仍可用于简单场景。

### 3. 超时控制（Python 3.11+）

```python
async def fetch_with_timeout(url: str) -> bytes:
    async with asyncio.timeout(5.0):
        return await fetch(url)

# 共享截止时间
async def pipeline() -> None:
    async with asyncio.timeout(10.0):
        data = await step1()
        result = await step2(data)  # 两步共用 10s 预算
```

### 4. 异常组（`except*`，Python 3.11+）

```python
try:
    async with asyncio.TaskGroup() as tg:
        tg.create_task(risky_op1())
        tg.create_task(risky_op2())
except* ValueError as eg:
    for exc in eg.exceptions:
        logger.error("ValueError: %s", exc)
except* IOError as eg:
    logger.error("IOError: %d errors", len(eg.exceptions))
```

### 5. 流量控制（Semaphore）

```python
sem = asyncio.Semaphore(10)  # 最多 10 个并发

async def bounded_fetch(url: str) -> bytes:
    async with sem:
        return await fetch(url)
```

### 6. 协程与生成器语义速查

| 类型 | 驱动方式 | 限制 |
|------|---------|------|
| 原生协程 `async def` | `await` | ❌ 不能 `.send()` |
| 同步生成器 `def` + `yield` | `next()` / `.send()` | ✅ 完整迭代协议 |
| 异步生成器 `async def` + `yield` | `async for` / `await anext()` | ❌ 无 `.send()` |

### 7. 上下文变量（`contextvars`）

跨协程/线程安全传递请求级上下文（如 request_id、user）：

```python
from contextvars import ContextVar

request_id: ContextVar[str] = ContextVar("request_id", default="-")

async def handler():
    request_id.set(uuid4().hex)
    await process()

async def process():
    logger.info("request=%s", request_id.get())  # 自动获取当前协程的值
```

**禁止**使用全局变量或 `threading.local()` 在 async 代码中传递上下文。

### 8. 子解释器并发（PEP 734，Python 3.14）

CPU 密集任务可用 `InterpreterPoolExecutor` 实现真正并行（每个解释器独立 GIL）：

```python
from concurrent.futures import InterpreterPoolExecutor

with InterpreterPoolExecutor(max_workers=4) as pool:
    results = list(pool.map(heavy_cpu_task, data))
```

相比多进程：启动开销更小，数据传递更灵活；相比多线程：不受 GIL 限制。

### 9. Free-threaded CPython（PEP 703）

Python 3.14 可选构建支持无 GIL（`python3.14t`）。在多线程 CPU 密集场景性能显著提升，但：
- 只在 **`python3.14t`** 构建下生效
- **确认所有原生扩展兼容无 GIL 模式**才能使用
- 默认构建仍带 GIL，普通项目无需切换

---

## 四、新标准库特性

### 1. 模板字符串（t-strings, PEP 750）

**关键区别：** t-strings 返回 `Template` 对象，**不是字符串**，允许库在渲染前处理插值（转义、验证、参数化）：

```python
# 安全 SQL 构建（需配合支持 t-strings 的库）
query = t"SELECT * FROM users WHERE name = {user_name} AND age > {min_age}"
# query 是 Template 对象，库可安全提取插值并参数化，防止注入

# 安全 HTML 渲染
html = t"<div class={cls}>{content}</div>"
```

**警告：** `str(t"...")` 会失去安全性。**禁止**直接转字符串，应始终通过支持 t-strings 的库渲染。

### 2. 临时切换工作目录（`contextlib.chdir`，Python 3.11+）

```python
from contextlib import chdir

with chdir("/tmp/sandbox"):
    result = subprocess.run(["make", "build"], capture_output=True)
# 退出 with 块后自动恢复原工作目录
```

### 3. Zstandard 压缩（PEP 784）

```python
import compression.zstd as zstd

compressed = zstd.compress(data, level=3)
decompressed = zstd.decompress(compressed)

with zstd.open("archive.zst", "wb") as f:
    f.write(large_data)
```

相比 `gzip`，同等压缩率下速度提升 3-10 倍。

### 4. 分块迭代（`itertools.batched()`，Python 3.12+）

```python
from itertools import batched

records = list(range(1000))
for chunk in batched(records, 100):
    db.bulk_insert(list(chunk))
```

### 5. TOML 解析（`tomllib`，Python 3.11+）

```python
import tomllib

with open("pyproject.toml", "rb") as f:  # 必须以 "rb" 打开
    config = tomllib.load(f)
```

### 6. `pathlib.Path.walk()`（Python 3.12+）

替代 `os.walk`，返回 `Path` 对象：

```python
from pathlib import Path

for root, dirs, files in Path("src").walk():
    for f in files:
        if f.endswith(".py"):
            print(root / f)
```

**禁止** 在新代码中使用 `os.walk()` 或字符串拼接路径。

### 7. `datetime.UTC`（Python 3.11+）

```python
from datetime import datetime, UTC

now = datetime.now(UTC)       # ✅ 时区感知
# datetime.now(timezone.utc)  ❌ 旧写法，Python 3.12+ 不推荐
```

**禁止** `datetime.utcnow()`（返回 naive datetime，3.12+ 已弃用）。

### 8. `zip(..., strict=True)`（Python 3.10+）

长度不等时立即报错，防止静默截断：

```python
for k, v in zip(keys, values, strict=True):
    ...
# 若长度不等：ValueError: zip() argument 2 is shorter than argument 1
```

**禁止** 不加 `strict=True` 的 `zip()` 在成对数据场景——静默截断是常见 bug 源。

### 9. 缓存装饰器

```python
from functools import cache, lru_cache

@cache              # 无大小限制（仅当输入空间小且有限时使用）
def factorial(n: int) -> int: ...

@lru_cache(maxsize=1024)   # 有界缓存（推荐默认）
def expensive(x: int) -> int: ...
```

**陷阱：** `@cache` 无限增长——对用户输入驱动的函数**禁止**使用，改用 `@lru_cache(maxsize=...)`。

### 10. 改进的错误提示

Python 3.14 持续改进：
- `IndexError`：显示列表长度和出错索引
- `AttributeError`：提示拼写相近的属性名
- `NameError`：提示作用域内相近变量名
- `TypeError`：参数错误时显示函数签名

---

## 五、数据类（`dataclass`）

### 1. 优先使用 `slots=True`

```python
from dataclasses import dataclass, field

@dataclass(slots=True, frozen=True)
class Point:
    x: float
    y: float

    def distance_from_origin(self) -> float:
        return (self.x ** 2 + self.y ** 2) ** 0.5
```

`slots=True` 减少内存占用，提升属性访问速度；`frozen=True` 使实例不可变，可作字典键。

### 2. 可变默认值用 `field(default_factory=...)`

```python
@dataclass
class Config:
    tags: list[str] = field(default_factory=list)
    metadata: dict[str, str] = field(default_factory=dict)
```

❌ **禁止** `tags: list[str] = []`（所有实例共享同一列表）。

### 3. `KW_ONLY` 分隔符

```python
from dataclasses import dataclass, KW_ONLY

@dataclass
class Request:
    method: str
    path: str
    _: KW_ONLY              # 之后的字段只能通过关键字传入
    timeout: float = 30.0
    headers: dict[str, str] = field(default_factory=dict)
```

---

## 六、结构化模式匹配（`match`）

### 1. 基本解构

```python
def process_event(event: dict) -> None:
    match event:
        case {"type": "click", "x": int(x), "y": int(y)}:
            handle_click(x, y)
        case {"type": "key", "key": str(k)} if k.startswith("F"):
            handle_function_key(k)
        case {"type": "resize", "width": int(w), "height": int(h)}:
            handle_resize(w, h)
        case {"type": str(unknown)}:
            logger.warning("未知事件类型: %s", unknown)
```

### 2. 类解构（dataclass / 命名元组）

```python
match response:
    case Response(status=200, data=list(items)):
        process_items(items)
    case Response(status=404):
        raise NotFoundError
    case Response(status=int(code)):
        raise HttpError(code)
```

### 3. OR 模式

```python
match status:
    case "ok" | "active" | "running":
        handle_ok()
    case "error" | "failed":
        handle_error()
```

### 4. 守卫（`if` 子句）

```python
match point:
    case Point(x=0, y=0):
        return "原点"
    case Point(x=x, y=y) if x == y:
        return "对角线"
    case Point(x=x, y=y) if x > 0 and y > 0:
        return "第一象限"
```

### 5. 序列模式（`[...]`、`[head, *tail]`）

```python
match command:
    case []:
        return "空命令"
    case [cmd]:
        run(cmd)
    case [cmd, *args]:
        run(cmd, args=args)
    case [cmd, flag, *args] if flag.startswith("-"):
        run(cmd, args=args, flags=[flag])
```

### 6. 结合 `assert_never()`

确保所有分支被覆盖（见第一节第 6 点）。

---

## 七、禁止事项

| 禁止 | 替代方案 |
|------|---------|
| `from __future__ import annotations` | 无需导入，3.14 原生支持 |
| `Optional[X]` | `X \| None` |
| `Union[X, Y]` | `X \| Y` |
| `typing.List`, `typing.Dict` 等 | `list`, `dict` 等内置泛型 |
| `T = TypeVar("T")` | `def f[T](...)` / `class C[T]:` |
| 原生协程调用 `.send()` | 只能 `await` |
| `asyncio.get_event_loop()` | `asyncio.run()` |
| `asyncio._get_running_loop()` 等私有 API | 使用公共 API |
| 字符串包裹前向引用 `'ClassName'` | 直接写类名 |
| 可变默认值 `field: list = []` | `field(default_factory=list)` |
| `datetime.utcnow()` | `datetime.now(UTC)` |
| `class C(str, Enum):` 多重继承 | `class C(StrEnum):` |
| `os.walk()` / 字符串拼接路径 | `pathlib.Path.walk()` / `Path / "sub"` |
| `zip(a, b)` 无 `strict=True`（成对数据） | `zip(a, b, strict=True)` |
| `@cache` 用于无界输入空间 | `@lru_cache(maxsize=...)` |
| async 中用 `threading.local()` | `contextvars.ContextVar` |
| `# type: ignore` 无解释注释 | 修复类型错误或附注释 |

---

## 八、工具链配置

```toml
[tool.pyright]
pythonVersion = "3.14"
typeCheckingMode = "strict"
reportMissingTypeStubs = false

[tool.mypy]
python_version = "3.14"
strict = true
warn_return_any = true
warn_unused_ignores = true

[tool.ruff]
target-version = "py314"
line-length = 88

[tool.ruff.lint]
select = ["E", "F", "I", "UP", "ANN", "B", "SIM", "PL", "RUF"]
# UP  — pyupgrade：flag 过时语法
# ANN — 强制函数注解
# B   — bugbear：常见陷阱
# SIM — 代码简化建议
# PL  — pylint 子集
# RUF — ruff 专有规则
ignore = ["ANN101", "ANN102"]  # 忽略 self/cls 注解要求

[tool.ruff.lint.isort]
known-first-party = ["myapp"]
```

---

## 九、通用实践

### 1. 类型注解覆盖

- 所有公共函数和方法必须有完整的参数和返回值注解。
- 私有方法（`_` 前缀）建议覆盖。
- 禁止 `# type: ignore` 无解释。

### 2. 异步 IO 边界

- `async def` 内**禁止**调用阻塞 IO（`time.sleep`、`requests.get`、同步 DB 驱动）——必然阻塞事件循环。
- 旧同步库必须调用时，用 `asyncio.to_thread(sync_fn, ...)` 放入线程池。
- CPU 密集任务用 `InterpreterPoolExecutor`（真并行）或 `ProcessPoolExecutor`。

### 3. 上下文管理

- 任何需要清理的资源使用 `with` / `async with`（文件、锁、连接、事务）。
- **禁止**手动 `open()` 不配 `close()`，或 `try/finally` 可简化为 `with` 时坚持用 `try/finally`。

### 4. 日期时间

- 默认**时区感知**：`datetime.now(UTC)` 或 `datetime.now(ZoneInfo("Asia/Shanghai"))`。
- 存储/传输用 UTC，展示时转换到用户时区。
- ISO 8601 格式：`dt.isoformat()` 输出，`datetime.fromisoformat(s)` 解析（3.11+ 支持完整 ISO 格式）。

---

遵循以上规则可确保 Python 3.14 代码充分利用语言演进带来的安全性、可读性与性能提升。


---

# sqlalchemy-v2

# SQLAlchemy 2.0 开发规则

本规则适用于 SQLAlchemy 2.0+ 项目，强制使用声明式数据映射、异步支持及现代查询风格。所有模型、会话、查询必须遵循以下约定。

---

## 一、声明式基类与命名约定

### 1. 基类定义

使用 `DeclarativeBase` 作为基类，**禁止**使用已废弃的 `declarative_base()` 工厂函数：

```python
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass
```

### 2. 统一约束命名约定（Alembic 稳定迁移必备）

所有约束必须显式配置命名模板，否则 Alembic 生成的迁移脚本在跨数据库/版本时不稳定：

```python
from sqlalchemy import MetaData
from sqlalchemy.orm import DeclarativeBase

NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)
```

### 3. 类型注解映射（`type_annotation_map`）

通过 `type_annotation_map` 自定义 Python 类型到 SQL 类型的默认映射，避免每处都写 `mapped_column(String(255))`：

```python
from datetime import datetime
from decimal import Decimal
from sqlalchemy import String, Numeric, DateTime
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    type_annotation_map = {
        str: String(255),                          # 默认 VARCHAR(255)
        Decimal: Numeric(12, 2),                   # 金额字段统一精度
        datetime: DateTime(timezone=True),         # 全项目启用时区
    }
```

---

## 二、模型字段定义

### 1. `Mapped` + `mapped_column`

使用 `Mapped[类型]` 注解 + `mapped_column()` 替代旧的 `Column` 定义：

```python
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, ForeignKey

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True)
    email: Mapped[str] = mapped_column(String(100), unique=True)
    is_active: Mapped[bool] = mapped_column(default=True)
```

**省略 `mapped_column()` 的条件：** 类型由 `type_annotation_map` 推断、无约束、无自定义参数：

```python
bio: Mapped[str]             # ✅ 等效于 mapped_column()，采用 map 中的 String(255)
```

**可选字段使用 `| None`：**

```python
age: Mapped[int | None]
deleted_at: Mapped[datetime | None]
```

### 2. 时间戳字段

为审计字段使用 `server_default` + `onupdate`，让数据库负责时间戳：

```python
from datetime import datetime
from sqlalchemy import func

class Audit:
    created_at: Mapped[datetime] = mapped_column(
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(),
        onupdate=func.now(),
    )
```

**注意：** `default=` 在 Python 端赋值（无 DB 支持时生效）；`server_default=` 在数据库端生成（迁移、裸 SQL 插入也生效）。审计字段**必须**用 `server_default`。

### 3. PostgreSQL 专用类型

使用方言 `dialects.postgresql` 中的类型：

```python
from sqlalchemy.dialects.postgresql import JSONB, ARRAY, UUID
import uuid

class Document(Base):
    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    tags: Mapped[list[str]] = mapped_column(ARRAY(String))
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB)
```

**注意：** `metadata` 是 SQLAlchemy 保留字，用 `metadata_` 或其他名称，通过 `mapped_column("metadata", ...)` 指定实际列名。

### 4. 约束定义

列级内联约束：

```python
from sqlalchemy import CheckConstraint

amount: Mapped[float] = mapped_column(
    CheckConstraint("amount >= 0", name="check_amount_positive"),
)
```

表级约束放入 `__table_args__`：

```python
from sqlalchemy import UniqueConstraint, Index

class Order(Base):
    __tablename__ = "orders"
    # ...
    __table_args__ = (
        UniqueConstraint("user_id", "order_no"),
        Index("ix_orders_status_created", "status", "created_at"),
        CheckConstraint("amount >= 0"),
    )
```

应用层验证可通过 `@validates` 装饰器实现，但**不能**取代数据库约束。

### 5. Mixin 复用字段

```python
class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now()
    )

class SoftDeleteMixin:
    deleted_at: Mapped[datetime | None] = mapped_column(default=None)

class User(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
```

---

## 三、关系与外键

### 1. 双向关系

```python
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship

class Address(Base):
    __tablename__ = "addresses"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str]
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    user: Mapped["User"] = relationship(back_populates="addresses")

class User(Base):
    __tablename__ = "users"
    # ...
    addresses: Mapped[list["Address"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
```

### 2. 级联行为（cascade）

| 常用值 | 含义 |
|-------|------|
| `"save-update"` | 默认：保存父对象时级联保存子对象 |
| `"delete"` | 删除父对象时删除子对象 |
| `"delete-orphan"` | 从父集合移除的子对象自动删除 |
| `"all, delete-orphan"` | 常用组合：关联管理生命周期 |

**ORM cascade** 与数据库 **`ondelete=`** 应同步配置：ORM 层防止脏数据，DB 层保证约束。

### 3. 一对一

`uselist=False` 定义一对一关系：

```python
profile: Mapped["Profile"] = relationship(back_populates="user", uselist=False)
```

### 4. 多对多

使用 `secondary` 指定关联表：

```python
from sqlalchemy import Table, Column

post_tags = Table(
    "post_tags",
    Base.metadata,
    Column("post_id", ForeignKey("posts.id"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id"), primary_key=True),
)

class Post(Base):
    __tablename__ = "posts"
    # ...
    tags: Mapped[list["Tag"]] = relationship(secondary=post_tags)
```

当关联表**有额外字段**时（如 `added_at`），改用 Association Object 模式（显式类）而非 `secondary=`。

---

## 四、会话与事务

### 1. 异步会话（推荐默认）

```python
from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

async_engine = create_async_engine(
    "postgresql+asyncpg://user:pass@localhost/db",
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=3600,
)

AsyncSessionLocal = async_sessionmaker(
    async_engine,
    expire_on_commit=False,      # 关键：避免提交后访问属性触发隐式 IO
    autoflush=False,
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
```

`expire_on_commit=False` **必选**。默认的 `True` 会让 commit 后所有属性过期，下次访问时触发隐式 IO——在 async 环境中会引发 `MissingGreenlet` 错误或意外的网络往返。

### 2. 异步 Lazy Loading（`AsyncAttrs`）

异步环境下默认 lazy-load **不可用**，会抛 `MissingGreenlet`。两种解决方案：

**方案 A — `AsyncAttrs` mixin（推荐）：**

```python
from sqlalchemy.ext.asyncio import AsyncAttrs

class Base(AsyncAttrs, DeclarativeBase):
    pass

# 使用时：
user = await session.get(User, 1)
addresses = await user.awaitable_attrs.addresses  # ✅ 异步 lazy-load
```

**方案 B — 预加载（性能更可控）：**

```python
from sqlalchemy.orm import selectinload

stmt = select(User).options(selectinload(User.addresses)).where(User.id == uid)
user = (await session.execute(stmt)).scalar_one()
# user.addresses 已加载，无需 await
```

### 3. 事务控制

**隐式事务（推荐）：** `async with AsyncSessionLocal()` 内的操作属同一事务，上方 `yield` + 外层 commit/rollback 模式会自动管理。

**显式嵌套事务（SAVEPOINT）：**

```python
async with session.begin_nested():   # SAVEPOINT
    session.add(obj)
    # 失败只回滚到 SAVEPOINT，不影响外层事务
```

### 4. 同步会话（仅必要时使用）

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

engine = create_engine("sqlite:///app.db")
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)

def get_db():
    with SessionLocal() as session:
        yield session
```

**禁止**手动 `session.close()`——依赖上下文管理器。

---

## 五、查询语句（2.0 风格）

### 1. 核心模式

**完全抛弃** `session.query()`，统一使用 `select()` + `execute()`：

```python
from sqlalchemy import select

stmt = select(User).where(User.username == "alice")
result = await session.execute(stmt)
user = result.scalar_one_or_none()
```

### 2. 结果取值速查

| 方法 | 返回 | 异常 |
|------|------|------|
| `.scalar_one()` | 单个对象 | 非 1 行则报错 |
| `.scalar_one_or_none()` | 单对象或 `None` | 多行报错 |
| `.scalars().first()` | 第一个对象或 `None` | 不报错 |
| `.scalars().all()` | 对象列表 | 不报错 |
| `.scalars().unique().all()` | 去重（使用 `joinedload` 时必需） | |

### 3. 条件动态构建

```python
stmt = select(User).where(User.is_active.is_(True))
if username:
    stmt = stmt.where(User.username == username)
if created_after:
    stmt = stmt.where(User.created_at >= created_after)
stmt = stmt.order_by(User.created_at.desc()).limit(50)
```

### 4. 加载策略

| 策略 | SQL 行为 | 适用场景 |
|------|---------|---------|
| `selectinload` | 主查询 + `IN (...)` 加载子集合 | 集合关系，推荐默认 |
| `joinedload` | 单个 JOIN | 多对一、一对一关系 |
| `contains_eager` | 显式 JOIN 后告知 ORM 已加载 | 手动 JOIN 时配合 |
| `raiseload` | 禁止 lazy-load（访问即报错） | 生产严格模式 |

```python
from sqlalchemy.orm import selectinload, joinedload

stmt = (
    select(User)
    .options(
        selectinload(User.addresses),       # 一对多
        joinedload(User.profile),            # 一对一
    )
    .where(User.id == uid)
)
```

### 5. 聚合与分组

```python
from sqlalchemy import func

stmt = (
    select(User.role, func.count().label("total"))
    .group_by(User.role)
    .having(func.count() > 10)
)
rows = (await session.execute(stmt)).all()
for row in rows:
    print(row.role, row.total)
```

### 6. UPSERT（PostgreSQL / SQLite / MySQL）

```python
from sqlalchemy.dialects.postgresql import insert

stmt = (
    insert(User)
    .values(email="a@x.com", username="alice")
    .on_conflict_do_update(
        index_elements=[User.email],
        set_={"username": "alice"},
    )
    .returning(User.id)
)
user_id = (await session.execute(stmt)).scalar_one()
```

### 7. `RETURNING` 子句

一次往返获取插入/更新结果：

```python
from sqlalchemy import insert, update

stmt = insert(User).values(...).returning(User.id, User.created_at)
result = await session.execute(stmt)
row = result.one()
```

### 8. 批量操作

```python
# 批量插入
await session.execute(
    insert(User),
    [{"username": "u1", "email": "..."}, {"username": "u2", "email": "..."}],
)

# IN 查询避免 N+1
stmt = select(User).where(User.id.in_(user_ids))
```

### 9. CTE（公用表表达式）

```python
recent_users_cte = (
    select(User.id, User.created_at)
    .where(User.created_at >= cutoff)
    .cte("recent_users")
)
stmt = (
    select(Post, recent_users_cte.c.created_at)
    .join(recent_users_cte, Post.user_id == recent_users_cte.c.id)
)
```

---

## 六、视图映射（只读）

视图使用独立 `MetaData`，避免被 `Base.metadata.create_all` 当作表创建：

```python
from sqlalchemy import Table, MetaData, Column, Integer, String

view_metadata = MetaData()

active_users_view = Table(
    "active_users",
    view_metadata,
    Column("id", Integer, primary_key=True),
    Column("username", String(50)),
)

class ActiveUser(Base):
    __table__ = active_users_view
```

视图 DDL（`CREATE OR REPLACE VIEW ...`）在 `lifespan` 中手动执行，**禁止**注册到 `Base.metadata`。

---

## 七、Alembic 迁移

### 1. 基本原则

- 使用 **Alembic** 管理所有 schema 变更，**禁止**在生产环境使用 `Base.metadata.create_all()`。
- 异步驱动下，`alembic/env.py` 的迁移运行函数需通过 `connection.run_sync(do_run_migrations)` 转为同步模式。

### 2. 自动生成迁移

```bash
alembic revision --autogenerate -m "add user email index"
```

**每次生成后必须人工复核：**
- 检查是否有"意外"的 drop/alter（通常是命名约定缺失导致）
- 服务端默认值、check 约束是否正确同步
- 数据迁移（data migration）须手写，autogenerate 不会生成

### 3. 迁移命名约定

`alembic.ini` 的 `file_template`：

```ini
file_template = %%(year)d%%(month).2d%%(day).2d_%%(hour).2d%%(minute).2d_%%(slug)s
```

生成形如 `20260424_1530_add_user_email_index.py`，时间有序易排序。

---

## 八、测试

### 1. 事务回滚模式（推荐）

每个测试在事务内运行，结束时 rollback，完美隔离且无需清库：

```python
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

@pytest.fixture
async def session(async_engine) -> AsyncSession:
    async with async_engine.connect() as conn:
        trans = await conn.begin()
        async_session = AsyncSession(bind=conn, expire_on_commit=False)
        # 嵌套 SAVEPOINT 让应用代码的 commit 可以正常工作
        await conn.begin_nested()
        yield async_session
        await async_session.close()
        await trans.rollback()
```

### 2. SQLite 内存库作为单元测试

```python
engine = create_async_engine("sqlite+aiosqlite:///:memory:")
```

**注意：** SQLite 不支持 `ARRAY`、`JSONB`、部分 `CHECK` 语法；真实测试建议用与生产相同的数据库（PostgreSQL testcontainers）。

---

## 九、性能与最佳实践

### 1. 连接池

```python
create_async_engine(
    url,
    pool_size=10,          # 常驻连接数
    max_overflow=20,       # 突发上限
    pool_pre_ping=True,    # 每次检出前 ping，防止连接失效
    pool_recycle=3600,     # 1 小时回收，规避云 DB 空闲断连
)
```

### 2. 查询优化

- **禁止**在循环中查询（N+1）——改用 `in_()` 或 `selectinload`。
- 长列表使用 `yield_per()` 流式处理：
  ```python
  result = await session.stream(select(User))
  async for user in result.scalars():
      process(user)
  ```
- 大量插入使用 `session.execute(insert(User), [dict, ...])` 而非逐个 add。
- 开发阶段开启 `echo="debug"` 观察 SQL；生产环境关闭。

### 3. 事务边界

- 长事务会持有行锁——及时 commit。
- 读多场景可用 `AUTOCOMMIT` 隔离级别的独立连接。

---

## 十、禁止事项

| 禁止 | 替代方案 |
|------|---------|
| `declarative_base()` | `class Base(DeclarativeBase)` |
| `Column()` 无 `Mapped` 注解 | `mapped_column()` + `Mapped[T]` |
| `session.query(...)` | `session.execute(select(...))` |
| 异步环境用同步 `Session` | `AsyncSession` |
| 异步下直接访问关系属性触发 lazy-load | `selectinload` 或 `AsyncAttrs.awaitable_attrs` |
| `Base.metadata` 注册视图 `Table` | 独立 `MetaData` |
| `Base.metadata.create_all()` 作为生产变更方式 | Alembic 迁移 |
| 缺少约束命名约定 | `MetaData(naming_convention=...)` |
| `expire_on_commit=True` 搭配 async | `expire_on_commit=False` |
| 循环内查询（N+1） | `in_()` / `selectinload` / 批量操作 |
| 审计字段使用 Python 端 `default=` | `server_default=func.now()` |

---

## 十一、项目集成建议

- **FastAPI 集成：** 通过依赖注入提供 `AsyncSession`，参见 FastAPI 规则第 1、4 节。
- **建表：** 仅开发/测试环境使用 `await conn.run_sync(Base.metadata.create_all)`；生产统一走 Alembic。
- **类型检查：** 使用 `sqlalchemy[mypy]` 或 `sqlalchemy-stubs`；`pyright` 配合 `Mapped[T]` 已开箱即用。
- **依赖安装：**
  ```bash
  uv add 'sqlalchemy[asyncio]' asyncpg alembic
  ```

---

遵循以上规则可保证 SQLAlchemy 2.0 使用规范、类型安全、并规避异步环境下最常见的陷阱。
