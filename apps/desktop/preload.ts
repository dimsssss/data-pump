// preload 진입점: ui(renderer)가 data(main)에 접근하는 데 필요한 API만 노출한다.
// 노출하는 API는 도메인마다 ipc.preload.ts에, 계약(채널·타입)은 contract.ts에 있다
import { exposeConnectionApi } from "./src/connection/ipc.preload";
import { exposeDatabaseApi } from "./src/database/ipc.preload";
import { exposeDriverApi } from "./src/driver/ipc.preload";

exposeDriverApi();
exposeConnectionApi();
exposeDatabaseApi();
