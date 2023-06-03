var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Debug from 'debug';
import { coreSymbolsPckg } from '../imports/core-symbols.js';
import { importPackage } from './1664940577200-tsx.js';
const debug = Debug('deeplinks:migrations:core-symbols');
const log = debug.extend('log');
const error = debug.extend('error');
export const up = () => __awaiter(void 0, void 0, void 0, function* () {
    log('up');
    const importResult = yield importPackage(coreSymbolsPckg);
    log(importResult);
});
export const down = () => __awaiter(void 0, void 0, void 0, function* () {
    log('down');
});
//# sourceMappingURL=1661392616544-core-symbols.js.map