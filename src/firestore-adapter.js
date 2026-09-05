"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirestoreAdapter = void 0;
var app_1 = require("firebase/app");
var firestore_1 = require("firebase/firestore");
var firebase_applet_config_json_1 = require("../firebase-applet-config.json");
var firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY || firebase_applet_config_json_1.default.apiKey,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || firebase_applet_config_json_1.default.authDomain,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || firebase_applet_config_json_1.default.projectId,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || firebase_applet_config_json_1.default.storageBucket,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebase_applet_config_json_1.default.messagingSenderId,
    appId: process.env.VITE_FIREBASE_APP_ID || firebase_applet_config_json_1.default.appId
};
// Verifica se as variáveis de ambiente estão presentes
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error("AVISO: Variáveis de ambiente do Firebase (VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID) não encontradas. O Firestore pode não funcionar corretamente.");
}
var app;
var firestore;
function getFirestoreInstance() {
    if (!firestore) {
        if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
            console.warn("Configuração do Firebase incompleta. Firestore não será inicializado.");
            return null;
        }
        app = (0, app_1.initializeApp)(firebaseConfig);
        firestore = (0, firestore_1.getFirestore)(app, firebase_applet_config_json_1.default.firestoreDatabaseId || '(default)');
    }
    return firestore;
}
var FirestoreAdapter = /** @class */ (function () {
    function FirestoreAdapter(collectionName, docId) {
        this.cachedData = null;
        this.lastReadTime = 0;
        this.CACHE_DURATION = 1000; // 1 second cache
        this.collectionName = collectionName;
        this.docId = docId;
    }
    Object.defineProperty(FirestoreAdapter.prototype, "docRef", {
        get: function () {
            var db = getFirestoreInstance();
            if (!db)
                return null;
            return (0, firestore_1.doc)(db, this.collectionName, this.docId);
        },
        enumerable: false,
        configurable: true
    });
    FirestoreAdapter.prototype.read = function () {
        return __awaiter(this, arguments, void 0, function (force) {
            var now, timeoutId, timeoutPromise, snapshot, error_1;
            if (force === void 0) { force = false; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.docRef)
                            return [2 /*return*/, null];
                        now = Date.now();
                        if (!force && this.cachedData && (now - this.lastReadTime < this.CACHE_DURATION)) {
                            return [2 /*return*/, this.cachedData];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        timeoutPromise = new Promise(function (_, reject) {
                            timeoutId = setTimeout(function () { return reject(new Error('Firestore read timeout')); }, 5000);
                        });
                        return [4 /*yield*/, Promise.race([
                                (0, firestore_1.getDoc)(this.docRef),
                                timeoutPromise
                            ])];
                    case 2:
                        snapshot = _a.sent();
                        if (timeoutId)
                            clearTimeout(timeoutId);
                        if (snapshot.exists()) {
                            this.cachedData = snapshot.data();
                            this.lastReadTime = Date.now();
                            return [2 /*return*/, this.cachedData];
                        }
                        return [2 /*return*/, null];
                    case 3:
                        error_1 = _a.sent();
                        if (timeoutId)
                            clearTimeout(timeoutId);
                        console.error("ERRO DETALHADO FIRESTORE:", {
                            message: error_1.message,
                            code: error_1.code,
                            stack: error_1.stack
                        });
                        // If we have cached data, return it even if expired, instead of throwing if network is down
                        if (this.cachedData) {
                            console.warn("Retornando dados cacheados expirados devido a erro no Firestore.");
                            return [2 /*return*/, this.cachedData];
                        }
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    FirestoreAdapter.prototype.write = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var timeoutId, cleanData, timeoutPromise, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.docRef)
                            return [2 /*return*/];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        // Update cache immediately on write
                        this.cachedData = JSON.parse(JSON.stringify(data)); // Deep copy
                        this.lastReadTime = Date.now();
                        cleanData = this.sanitizeForFirestore(data);
                        timeoutPromise = new Promise(function (_, reject) {
                            timeoutId = setTimeout(function () { return reject(new Error('Firestore write timeout')); }, 5000);
                        });
                        return [4 /*yield*/, Promise.race([
                                (0, firestore_1.setDoc)(this.docRef, cleanData),
                                timeoutPromise
                            ])];
                    case 2:
                        _a.sent();
                        if (timeoutId)
                            clearTimeout(timeoutId);
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        if (timeoutId)
                            clearTimeout(timeoutId);
                        console.error("Erro ao escrever no Firestore:", error_2);
                        throw error_2;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    FirestoreAdapter.prototype.sanitizeForFirestore = function (obj) {
        var _this = this;
        if (obj === null || obj === undefined) {
            return null; // Convert undefined to null or just return null
        }
        if (typeof obj === 'number') {
            if (isNaN(obj) || !isFinite(obj)) {
                return null; // Firestore doesn't support NaN or Infinity
            }
            return obj;
        }
        if (typeof obj !== 'object') {
            return obj;
        }
        if (Array.isArray(obj)) {
            // Filter out undefined and sanitize elements
            return obj
                .filter(function (item) { return item !== undefined; })
                .map(function (item) { return _this.sanitizeForFirestore(item); });
        }
        var newObj = {};
        Object.keys(obj).forEach(function (key) {
            var value = obj[key];
            if (value !== undefined) {
                newObj[key] = _this.sanitizeForFirestore(value);
            }
        });
        return newObj;
    };
    return FirestoreAdapter;
}());
exports.FirestoreAdapter = FirestoreAdapter;
