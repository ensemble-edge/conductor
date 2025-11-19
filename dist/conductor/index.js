import { a as __toCommonJS, i as __require, n as __esmMin, o as __toDynamicImportESM, r as __export, s as __toESM, t as __commonJSMin } from "./chunk-CjLZ-eKX.js";
import { i as Result, n as EnsembleExecutionError, r as Errors, t as AgentExecutionError } from "./error-types-CCbRhFX3.js";
import * as fs$1 from "fs/promises";
import * as path from "path";
import { dirname, extname, resolve, sep } from "path";
import { readFile, readFileSync, stat, statSync } from "fs";
import { PassThrough } from "stream";
import { createRequire } from "module";
var ALIAS = Symbol.for("yaml.alias");
var DOC = Symbol.for("yaml.document");
var MAP = Symbol.for("yaml.map");
var PAIR = Symbol.for("yaml.pair");
var SCALAR$1 = Symbol.for("yaml.scalar");
var SEQ = Symbol.for("yaml.seq");
var NODE_TYPE = Symbol.for("yaml.node.type");
var isAlias = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === ALIAS;
var isDocument = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === DOC;
var isMap = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === MAP;
var isPair = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === PAIR;
var isScalar = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SCALAR$1;
var isSeq = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SEQ;
function isCollection(node) {
	if (node && typeof node === "object") switch (node[NODE_TYPE]) {
		case MAP:
		case SEQ: return true;
	}
	return false;
}
function isNode(node) {
	if (node && typeof node === "object") switch (node[NODE_TYPE]) {
		case ALIAS:
		case MAP:
		case SCALAR$1:
		case SEQ: return true;
	}
	return false;
}
var hasAnchor = (node) => (isScalar(node) || isCollection(node)) && !!node.anchor;
var BREAK$1 = Symbol("break visit");
var SKIP$1 = Symbol("skip children");
var REMOVE$1 = Symbol("remove node");
function visit$1(node, visitor) {
	const visitor_ = initVisitor(visitor);
	if (isDocument(node)) {
		if (visit_(null, node.contents, visitor_, Object.freeze([node])) === REMOVE$1) node.contents = null;
	} else visit_(null, node, visitor_, Object.freeze([]));
}
visit$1.BREAK = BREAK$1;
visit$1.SKIP = SKIP$1;
visit$1.REMOVE = REMOVE$1;
function visit_(key, node, visitor, path$1) {
	const ctrl = callVisitor(key, node, visitor, path$1);
	if (isNode(ctrl) || isPair(ctrl)) {
		replaceNode(key, path$1, ctrl);
		return visit_(key, ctrl, visitor, path$1);
	}
	if (typeof ctrl !== "symbol") {
		if (isCollection(node)) {
			path$1 = Object.freeze(path$1.concat(node));
			for (let i = 0; i < node.items.length; ++i) {
				const ci = visit_(i, node.items[i], visitor, path$1);
				if (typeof ci === "number") i = ci - 1;
				else if (ci === BREAK$1) return BREAK$1;
				else if (ci === REMOVE$1) {
					node.items.splice(i, 1);
					i -= 1;
				}
			}
		} else if (isPair(node)) {
			path$1 = Object.freeze(path$1.concat(node));
			const ck = visit_("key", node.key, visitor, path$1);
			if (ck === BREAK$1) return BREAK$1;
			else if (ck === REMOVE$1) node.key = null;
			const cv = visit_("value", node.value, visitor, path$1);
			if (cv === BREAK$1) return BREAK$1;
			else if (cv === REMOVE$1) node.value = null;
		}
	}
	return ctrl;
}
async function visitAsync(node, visitor) {
	const visitor_ = initVisitor(visitor);
	if (isDocument(node)) {
		if (await visitAsync_(null, node.contents, visitor_, Object.freeze([node])) === REMOVE$1) node.contents = null;
	} else await visitAsync_(null, node, visitor_, Object.freeze([]));
}
visitAsync.BREAK = BREAK$1;
visitAsync.SKIP = SKIP$1;
visitAsync.REMOVE = REMOVE$1;
async function visitAsync_(key, node, visitor, path$1) {
	const ctrl = await callVisitor(key, node, visitor, path$1);
	if (isNode(ctrl) || isPair(ctrl)) {
		replaceNode(key, path$1, ctrl);
		return visitAsync_(key, ctrl, visitor, path$1);
	}
	if (typeof ctrl !== "symbol") {
		if (isCollection(node)) {
			path$1 = Object.freeze(path$1.concat(node));
			for (let i = 0; i < node.items.length; ++i) {
				const ci = await visitAsync_(i, node.items[i], visitor, path$1);
				if (typeof ci === "number") i = ci - 1;
				else if (ci === BREAK$1) return BREAK$1;
				else if (ci === REMOVE$1) {
					node.items.splice(i, 1);
					i -= 1;
				}
			}
		} else if (isPair(node)) {
			path$1 = Object.freeze(path$1.concat(node));
			const ck = await visitAsync_("key", node.key, visitor, path$1);
			if (ck === BREAK$1) return BREAK$1;
			else if (ck === REMOVE$1) node.key = null;
			const cv = await visitAsync_("value", node.value, visitor, path$1);
			if (cv === BREAK$1) return BREAK$1;
			else if (cv === REMOVE$1) node.value = null;
		}
	}
	return ctrl;
}
function initVisitor(visitor) {
	if (typeof visitor === "object" && (visitor.Collection || visitor.Node || visitor.Value)) return Object.assign({
		Alias: visitor.Node,
		Map: visitor.Node,
		Scalar: visitor.Node,
		Seq: visitor.Node
	}, visitor.Value && {
		Map: visitor.Value,
		Scalar: visitor.Value,
		Seq: visitor.Value
	}, visitor.Collection && {
		Map: visitor.Collection,
		Seq: visitor.Collection
	}, visitor);
	return visitor;
}
function callVisitor(key, node, visitor, path$1) {
	if (typeof visitor === "function") return visitor(key, node, path$1);
	if (isMap(node)) return visitor.Map?.(key, node, path$1);
	if (isSeq(node)) return visitor.Seq?.(key, node, path$1);
	if (isPair(node)) return visitor.Pair?.(key, node, path$1);
	if (isScalar(node)) return visitor.Scalar?.(key, node, path$1);
	if (isAlias(node)) return visitor.Alias?.(key, node, path$1);
}
function replaceNode(key, path$1, node) {
	const parent = path$1[path$1.length - 1];
	if (isCollection(parent)) parent.items[key] = node;
	else if (isPair(parent)) if (key === "key") parent.key = node;
	else parent.value = node;
	else if (isDocument(parent)) parent.contents = node;
	else {
		const pt = isAlias(parent) ? "alias" : "scalar";
		throw new Error(`Cannot replace node with ${pt} parent`);
	}
}
var escapeChars = {
	"!": "%21",
	",": "%2C",
	"[": "%5B",
	"]": "%5D",
	"{": "%7B",
	"}": "%7D"
};
var escapeTagName = (tn) => tn.replace(/[!,[\]{}]/g, (ch) => escapeChars[ch]);
var Directives = class Directives {
	constructor(yaml, tags$1) {
		this.docStart = null;
		this.docEnd = false;
		this.yaml = Object.assign({}, Directives.defaultYaml, yaml);
		this.tags = Object.assign({}, Directives.defaultTags, tags$1);
	}
	clone() {
		const copy = new Directives(this.yaml, this.tags);
		copy.docStart = this.docStart;
		return copy;
	}
	atDocument() {
		const res = new Directives(this.yaml, this.tags);
		switch (this.yaml.version) {
			case "1.1":
				this.atNextDocument = true;
				break;
			case "1.2":
				this.atNextDocument = false;
				this.yaml = {
					explicit: Directives.defaultYaml.explicit,
					version: "1.2"
				};
				this.tags = Object.assign({}, Directives.defaultTags);
				break;
		}
		return res;
	}
	add(line, onError) {
		if (this.atNextDocument) {
			this.yaml = {
				explicit: Directives.defaultYaml.explicit,
				version: "1.1"
			};
			this.tags = Object.assign({}, Directives.defaultTags);
			this.atNextDocument = false;
		}
		const parts = line.trim().split(/[ \t]+/);
		const name = parts.shift();
		switch (name) {
			case "%TAG": {
				if (parts.length !== 2) {
					onError(0, "%TAG directive should contain exactly two parts");
					if (parts.length < 2) return false;
				}
				const [handle, prefix] = parts;
				this.tags[handle] = prefix;
				return true;
			}
			case "%YAML": {
				this.yaml.explicit = true;
				if (parts.length !== 1) {
					onError(0, "%YAML directive should contain exactly one part");
					return false;
				}
				const [version] = parts;
				if (version === "1.1" || version === "1.2") {
					this.yaml.version = version;
					return true;
				} else {
					const isValid$1 = /^\d+\.\d+$/.test(version);
					onError(6, `Unsupported YAML version ${version}`, isValid$1);
					return false;
				}
			}
			default:
				onError(0, `Unknown directive ${name}`, true);
				return false;
		}
	}
	tagName(source, onError) {
		if (source === "!") return "!";
		if (source[0] !== "!") {
			onError(`Not a valid tag: ${source}`);
			return null;
		}
		if (source[1] === "<") {
			const verbatim = source.slice(2, -1);
			if (verbatim === "!" || verbatim === "!!") {
				onError(`Verbatim tags aren't resolved, so ${source} is invalid.`);
				return null;
			}
			if (source[source.length - 1] !== ">") onError("Verbatim tags must end with a >");
			return verbatim;
		}
		const [, handle, suffix] = source.match(/^(.*!)([^!]*)$/s);
		if (!suffix) onError(`The ${source} tag has no suffix`);
		const prefix = this.tags[handle];
		if (prefix) try {
			return prefix + decodeURIComponent(suffix);
		} catch (error) {
			onError(String(error));
			return null;
		}
		if (handle === "!") return source;
		onError(`Could not resolve tag: ${source}`);
		return null;
	}
	tagString(tag) {
		for (const [handle, prefix] of Object.entries(this.tags)) if (tag.startsWith(prefix)) return handle + escapeTagName(tag.substring(prefix.length));
		return tag[0] === "!" ? tag : `!<${tag}>`;
	}
	toString(doc) {
		const lines = this.yaml.explicit ? [`%YAML ${this.yaml.version || "1.2"}`] : [];
		const tagEntries = Object.entries(this.tags);
		let tagNames;
		if (doc && tagEntries.length > 0 && isNode(doc.contents)) {
			const tags$1 = {};
			visit$1(doc.contents, (_key, node) => {
				if (isNode(node) && node.tag) tags$1[node.tag] = true;
			});
			tagNames = Object.keys(tags$1);
		} else tagNames = [];
		for (const [handle, prefix] of tagEntries) {
			if (handle === "!!" && prefix === "tag:yaml.org,2002:") continue;
			if (!doc || tagNames.some((tn) => tn.startsWith(prefix))) lines.push(`%TAG ${handle} ${prefix}`);
		}
		return lines.join("\n");
	}
};
Directives.defaultYaml = {
	explicit: false,
	version: "1.2"
};
Directives.defaultTags = { "!!": "tag:yaml.org,2002:" };
function anchorIsValid(anchor) {
	if (/[\x00-\x19\s,[\]{}]/.test(anchor)) {
		const msg = `Anchor must not contain whitespace or control characters: ${JSON.stringify(anchor)}`;
		throw new Error(msg);
	}
	return true;
}
function anchorNames(root) {
	const anchors = /* @__PURE__ */ new Set();
	visit$1(root, { Value(_key, node) {
		if (node.anchor) anchors.add(node.anchor);
	} });
	return anchors;
}
function findNewAnchor(prefix, exclude) {
	for (let i = 1;; ++i) {
		const name = `${prefix}${i}`;
		if (!exclude.has(name)) return name;
	}
}
function createNodeAnchors(doc, prefix) {
	const aliasObjects = [];
	const sourceObjects = /* @__PURE__ */ new Map();
	let prevAnchors = null;
	return {
		onAnchor: (source) => {
			aliasObjects.push(source);
			prevAnchors ?? (prevAnchors = anchorNames(doc));
			const anchor = findNewAnchor(prefix, prevAnchors);
			prevAnchors.add(anchor);
			return anchor;
		},
		setAnchors: () => {
			for (const source of aliasObjects) {
				const ref = sourceObjects.get(source);
				if (typeof ref === "object" && ref.anchor && (isScalar(ref.node) || isCollection(ref.node))) ref.node.anchor = ref.anchor;
				else {
					const error = /* @__PURE__ */ new Error("Failed to resolve repeated object (this should not happen)");
					error.source = source;
					throw error;
				}
			}
		},
		sourceObjects
	};
}
function applyReviver(reviver, obj, key, val) {
	if (val && typeof val === "object") if (Array.isArray(val)) for (let i = 0, len = val.length; i < len; ++i) {
		const v0 = val[i];
		const v1 = applyReviver(reviver, val, String(i), v0);
		if (v1 === void 0) delete val[i];
		else if (v1 !== v0) val[i] = v1;
	}
	else if (val instanceof Map) for (const k of Array.from(val.keys())) {
		const v0 = val.get(k);
		const v1 = applyReviver(reviver, val, k, v0);
		if (v1 === void 0) val.delete(k);
		else if (v1 !== v0) val.set(k, v1);
	}
	else if (val instanceof Set) for (const v0 of Array.from(val)) {
		const v1 = applyReviver(reviver, val, v0, v0);
		if (v1 === void 0) val.delete(v0);
		else if (v1 !== v0) {
			val.delete(v0);
			val.add(v1);
		}
	}
	else for (const [k, v0] of Object.entries(val)) {
		const v1 = applyReviver(reviver, val, k, v0);
		if (v1 === void 0) delete val[k];
		else if (v1 !== v0) val[k] = v1;
	}
	return reviver.call(obj, key, val);
}
function toJS(value, arg, ctx) {
	if (Array.isArray(value)) return value.map((v, i) => toJS(v, String(i), ctx));
	if (value && typeof value.toJSON === "function") {
		if (!ctx || !hasAnchor(value)) return value.toJSON(arg, ctx);
		const data = {
			aliasCount: 0,
			count: 1,
			res: void 0
		};
		ctx.anchors.set(value, data);
		ctx.onCreate = (res$1) => {
			data.res = res$1;
			delete ctx.onCreate;
		};
		const res = value.toJSON(arg, ctx);
		if (ctx.onCreate) ctx.onCreate(res);
		return res;
	}
	if (typeof value === "bigint" && !ctx?.keep) return Number(value);
	return value;
}
var NodeBase = class {
	constructor(type) {
		Object.defineProperty(this, NODE_TYPE, { value: type });
	}
	clone() {
		const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
		if (this.range) copy.range = this.range.slice();
		return copy;
	}
	toJS(doc, { mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
		if (!isDocument(doc)) throw new TypeError("A document argument is required");
		const ctx = {
			anchors: /* @__PURE__ */ new Map(),
			doc,
			keep: true,
			mapAsMap: mapAsMap === true,
			mapKeyWarned: false,
			maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
		};
		const res = toJS(this, "", ctx);
		if (typeof onAnchor === "function") for (const { count, res: res$1 } of ctx.anchors.values()) onAnchor(res$1, count);
		return typeof reviver === "function" ? applyReviver(reviver, { "": res }, "", res) : res;
	}
};
var Alias = class extends NodeBase {
	constructor(source) {
		super(ALIAS);
		this.source = source;
		Object.defineProperty(this, "tag", { set() {
			throw new Error("Alias nodes cannot have tags");
		} });
	}
	resolve(doc, ctx) {
		let nodes;
		if (ctx?.aliasResolveCache) nodes = ctx.aliasResolveCache;
		else {
			nodes = [];
			visit$1(doc, { Node: (_key, node) => {
				if (isAlias(node) || hasAnchor(node)) nodes.push(node);
			} });
			if (ctx) ctx.aliasResolveCache = nodes;
		}
		let found = void 0;
		for (const node of nodes) {
			if (node === this) break;
			if (node.anchor === this.source) found = node;
		}
		return found;
	}
	toJSON(_arg, ctx) {
		if (!ctx) return { source: this.source };
		const { anchors, doc, maxAliasCount } = ctx;
		const source = this.resolve(doc, ctx);
		if (!source) {
			const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
			throw new ReferenceError(msg);
		}
		let data = anchors.get(source);
		if (!data) {
			toJS(source, null, ctx);
			data = anchors.get(source);
		}
		/* istanbul ignore if */
		if (!data || data.res === void 0) throw new ReferenceError("This should not happen: Alias anchor was not resolved?");
		if (maxAliasCount >= 0) {
			data.count += 1;
			if (data.aliasCount === 0) data.aliasCount = getAliasCount(doc, source, anchors);
			if (data.count * data.aliasCount > maxAliasCount) throw new ReferenceError("Excessive alias count indicates a resource exhaustion attack");
		}
		return data.res;
	}
	toString(ctx, _onComment, _onChompKeep) {
		const src = `*${this.source}`;
		if (ctx) {
			anchorIsValid(this.source);
			if (ctx.options.verifyAliasOrder && !ctx.anchors.has(this.source)) {
				const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
				throw new Error(msg);
			}
			if (ctx.implicitKey) return `${src} `;
		}
		return src;
	}
};
function getAliasCount(doc, node, anchors) {
	if (isAlias(node)) {
		const source = node.resolve(doc);
		const anchor = anchors && source && anchors.get(source);
		return anchor ? anchor.count * anchor.aliasCount : 0;
	} else if (isCollection(node)) {
		let count = 0;
		for (const item of node.items) {
			const c = getAliasCount(doc, item, anchors);
			if (c > count) count = c;
		}
		return count;
	} else if (isPair(node)) {
		const kc = getAliasCount(doc, node.key, anchors);
		const vc = getAliasCount(doc, node.value, anchors);
		return Math.max(kc, vc);
	}
	return 1;
}
var isScalarValue = (value) => !value || typeof value !== "function" && typeof value !== "object";
var Scalar = class extends NodeBase {
	constructor(value) {
		super(SCALAR$1);
		this.value = value;
	}
	toJSON(arg, ctx) {
		return ctx?.keep ? this.value : toJS(this.value, arg, ctx);
	}
	toString() {
		return String(this.value);
	}
};
Scalar.BLOCK_FOLDED = "BLOCK_FOLDED";
Scalar.BLOCK_LITERAL = "BLOCK_LITERAL";
Scalar.PLAIN = "PLAIN";
Scalar.QUOTE_DOUBLE = "QUOTE_DOUBLE";
Scalar.QUOTE_SINGLE = "QUOTE_SINGLE";
var defaultTagPrefix = "tag:yaml.org,2002:";
function findTagObject(value, tagName, tags$1) {
	if (tagName) {
		const match = tags$1.filter((t) => t.tag === tagName);
		const tagObj = match.find((t) => !t.format) ?? match[0];
		if (!tagObj) throw new Error(`Tag ${tagName} not found`);
		return tagObj;
	}
	return tags$1.find((t) => t.identify?.(value) && !t.format);
}
function createNode(value, tagName, ctx) {
	if (isDocument(value)) value = value.contents;
	if (isNode(value)) return value;
	if (isPair(value)) {
		const map$2 = ctx.schema[MAP].createNode?.(ctx.schema, null, ctx);
		map$2.items.push(value);
		return map$2;
	}
	if (value instanceof String || value instanceof Number || value instanceof Boolean || typeof BigInt !== "undefined" && value instanceof BigInt) value = value.valueOf();
	const { aliasDuplicateObjects, onAnchor, onTagObj, schema: schema$3, sourceObjects } = ctx;
	let ref = void 0;
	if (aliasDuplicateObjects && value && typeof value === "object") {
		ref = sourceObjects.get(value);
		if (ref) {
			ref.anchor ?? (ref.anchor = onAnchor(value));
			return new Alias(ref.anchor);
		} else {
			ref = {
				anchor: null,
				node: null
			};
			sourceObjects.set(value, ref);
		}
	}
	if (tagName?.startsWith("!!")) tagName = defaultTagPrefix + tagName.slice(2);
	let tagObj = findTagObject(value, tagName, schema$3.tags);
	if (!tagObj) {
		if (value && typeof value.toJSON === "function") value = value.toJSON();
		if (!value || typeof value !== "object") {
			const node$1 = new Scalar(value);
			if (ref) ref.node = node$1;
			return node$1;
		}
		tagObj = value instanceof Map ? schema$3[MAP] : Symbol.iterator in Object(value) ? schema$3[SEQ] : schema$3[MAP];
	}
	if (onTagObj) {
		onTagObj(tagObj);
		delete ctx.onTagObj;
	}
	const node = tagObj?.createNode ? tagObj.createNode(ctx.schema, value, ctx) : typeof tagObj?.nodeClass?.from === "function" ? tagObj.nodeClass.from(ctx.schema, value, ctx) : new Scalar(value);
	if (tagName) node.tag = tagName;
	else if (!tagObj.default) node.tag = tagObj.tag;
	if (ref) ref.node = node;
	return node;
}
function collectionFromPath(schema$3, path$1, value) {
	let v = value;
	for (let i = path$1.length - 1; i >= 0; --i) {
		const k = path$1[i];
		if (typeof k === "number" && Number.isInteger(k) && k >= 0) {
			const a = [];
			a[k] = v;
			v = a;
		} else v = new Map([[k, v]]);
	}
	return createNode(v, void 0, {
		aliasDuplicateObjects: false,
		keepUndefined: false,
		onAnchor: () => {
			throw new Error("This should not happen, please report a bug.");
		},
		schema: schema$3,
		sourceObjects: /* @__PURE__ */ new Map()
	});
}
var isEmptyPath = (path$1) => path$1 == null || typeof path$1 === "object" && !!path$1[Symbol.iterator]().next().done;
var Collection = class extends NodeBase {
	constructor(type, schema$3) {
		super(type);
		Object.defineProperty(this, "schema", {
			value: schema$3,
			configurable: true,
			enumerable: false,
			writable: true
		});
	}
	clone(schema$3) {
		const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
		if (schema$3) copy.schema = schema$3;
		copy.items = copy.items.map((it) => isNode(it) || isPair(it) ? it.clone(schema$3) : it);
		if (this.range) copy.range = this.range.slice();
		return copy;
	}
	addIn(path$1, value) {
		if (isEmptyPath(path$1)) this.add(value);
		else {
			const [key, ...rest] = path$1;
			const node = this.get(key, true);
			if (isCollection(node)) node.addIn(rest, value);
			else if (node === void 0 && this.schema) this.set(key, collectionFromPath(this.schema, rest, value));
			else throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
		}
	}
	deleteIn(path$1) {
		const [key, ...rest] = path$1;
		if (rest.length === 0) return this.delete(key);
		const node = this.get(key, true);
		if (isCollection(node)) return node.deleteIn(rest);
		else throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
	}
	getIn(path$1, keepScalar) {
		const [key, ...rest] = path$1;
		const node = this.get(key, true);
		if (rest.length === 0) return !keepScalar && isScalar(node) ? node.value : node;
		else return isCollection(node) ? node.getIn(rest, keepScalar) : void 0;
	}
	hasAllNullValues(allowScalar) {
		return this.items.every((node) => {
			if (!isPair(node)) return false;
			const n = node.value;
			return n == null || allowScalar && isScalar(n) && n.value == null && !n.commentBefore && !n.comment && !n.tag;
		});
	}
	hasIn(path$1) {
		const [key, ...rest] = path$1;
		if (rest.length === 0) return this.has(key);
		const node = this.get(key, true);
		return isCollection(node) ? node.hasIn(rest) : false;
	}
	setIn(path$1, value) {
		const [key, ...rest] = path$1;
		if (rest.length === 0) this.set(key, value);
		else {
			const node = this.get(key, true);
			if (isCollection(node)) node.setIn(rest, value);
			else if (node === void 0 && this.schema) this.set(key, collectionFromPath(this.schema, rest, value));
			else throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
		}
	}
};
var stringifyComment = (str) => str.replace(/^(?!$)(?: $)?/gm, "#");
function indentComment(comment, indent) {
	if (/^\n+$/.test(comment)) return comment.substring(1);
	return indent ? comment.replace(/^(?! *$)/gm, indent) : comment;
}
var lineComment = (str, indent, comment) => str.endsWith("\n") ? indentComment(comment, indent) : comment.includes("\n") ? "\n" + indentComment(comment, indent) : (str.endsWith(" ") ? "" : " ") + comment;
var FOLD_FLOW = "flow";
var FOLD_BLOCK = "block";
var FOLD_QUOTED = "quoted";
function foldFlowLines(text, indent, mode = "flow", { indentAtStart, lineWidth = 80, minContentWidth = 20, onFold, onOverflow } = {}) {
	if (!lineWidth || lineWidth < 0) return text;
	if (lineWidth < minContentWidth) minContentWidth = 0;
	const endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent.length);
	if (text.length <= endStep) return text;
	const folds = [];
	const escapedFolds = {};
	let end = lineWidth - indent.length;
	if (typeof indentAtStart === "number") if (indentAtStart > lineWidth - Math.max(2, minContentWidth)) folds.push(0);
	else end = lineWidth - indentAtStart;
	let split$1 = void 0;
	let prev = void 0;
	let overflow = false;
	let i = -1;
	let escStart = -1;
	let escEnd = -1;
	if (mode === "block") {
		i = consumeMoreIndentedLines(text, i, indent.length);
		if (i !== -1) end = i + endStep;
	}
	for (let ch; ch = text[i += 1];) {
		if (mode === "quoted" && ch === "\\") {
			escStart = i;
			switch (text[i + 1]) {
				case "x":
					i += 3;
					break;
				case "u":
					i += 5;
					break;
				case "U":
					i += 9;
					break;
				default: i += 1;
			}
			escEnd = i;
		}
		if (ch === "\n") {
			if (mode === "block") i = consumeMoreIndentedLines(text, i, indent.length);
			end = i + indent.length + endStep;
			split$1 = void 0;
		} else {
			if (ch === " " && prev && prev !== " " && prev !== "\n" && prev !== "	") {
				const next = text[i + 1];
				if (next && next !== " " && next !== "\n" && next !== "	") split$1 = i;
			}
			if (i >= end) if (split$1) {
				folds.push(split$1);
				end = split$1 + endStep;
				split$1 = void 0;
			} else if (mode === "quoted") {
				while (prev === " " || prev === "	") {
					prev = ch;
					ch = text[i += 1];
					overflow = true;
				}
				const j = i > escEnd + 1 ? i - 2 : escStart - 1;
				if (escapedFolds[j]) return text;
				folds.push(j);
				escapedFolds[j] = true;
				end = j + endStep;
				split$1 = void 0;
			} else overflow = true;
		}
		prev = ch;
	}
	if (overflow && onOverflow) onOverflow();
	if (folds.length === 0) return text;
	if (onFold) onFold();
	let res = text.slice(0, folds[0]);
	for (let i$1 = 0; i$1 < folds.length; ++i$1) {
		const fold = folds[i$1];
		const end$1 = folds[i$1 + 1] || text.length;
		if (fold === 0) res = `\n${indent}${text.slice(0, end$1)}`;
		else {
			if (mode === "quoted" && escapedFolds[fold]) res += `${text[fold]}\\`;
			res += `\n${indent}${text.slice(fold + 1, end$1)}`;
		}
	}
	return res;
}
function consumeMoreIndentedLines(text, i, indent) {
	let end = i;
	let start = i + 1;
	let ch = text[start];
	while (ch === " " || ch === "	") if (i < start + indent) ch = text[++i];
	else {
		do
			ch = text[++i];
		while (ch && ch !== "\n");
		end = i;
		start = i + 1;
		ch = text[start];
	}
	return end;
}
var getFoldOptions = (ctx, isBlock$1) => ({
	indentAtStart: isBlock$1 ? ctx.indent.length : ctx.indentAtStart,
	lineWidth: ctx.options.lineWidth,
	minContentWidth: ctx.options.minContentWidth
});
var containsDocumentMarker = (str) => /^(%|---|\.\.\.)/m.test(str);
function lineLengthOverLimit(str, lineWidth, indentLength) {
	if (!lineWidth || lineWidth < 0) return false;
	const limit$1 = lineWidth - indentLength;
	const strLen = str.length;
	if (strLen <= limit$1) return false;
	for (let i = 0, start = 0; i < strLen; ++i) if (str[i] === "\n") {
		if (i - start > limit$1) return true;
		start = i + 1;
		if (strLen - start <= limit$1) return false;
	}
	return true;
}
function doubleQuotedString(value, ctx) {
	const json$1 = JSON.stringify(value);
	if (ctx.options.doubleQuotedAsJSON) return json$1;
	const { implicitKey } = ctx;
	const minMultiLineLength = ctx.options.doubleQuotedMinMultiLineLength;
	const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
	let str = "";
	let start = 0;
	for (let i = 0, ch = json$1[i]; ch; ch = json$1[++i]) {
		if (ch === " " && json$1[i + 1] === "\\" && json$1[i + 2] === "n") {
			str += json$1.slice(start, i) + "\\ ";
			i += 1;
			start = i;
			ch = "\\";
		}
		if (ch === "\\") switch (json$1[i + 1]) {
			case "u":
				{
					str += json$1.slice(start, i);
					const code = json$1.substr(i + 2, 4);
					switch (code) {
						case "0000":
							str += "\\0";
							break;
						case "0007":
							str += "\\a";
							break;
						case "000b":
							str += "\\v";
							break;
						case "001b":
							str += "\\e";
							break;
						case "0085":
							str += "\\N";
							break;
						case "00a0":
							str += "\\_";
							break;
						case "2028":
							str += "\\L";
							break;
						case "2029":
							str += "\\P";
							break;
						default: if (code.substr(0, 2) === "00") str += "\\x" + code.substr(2);
						else str += json$1.substr(i, 6);
					}
					i += 5;
					start = i + 1;
				}
				break;
			case "n":
				if (implicitKey || json$1[i + 2] === "\"" || json$1.length < minMultiLineLength) i += 1;
				else {
					str += json$1.slice(start, i) + "\n\n";
					while (json$1[i + 2] === "\\" && json$1[i + 3] === "n" && json$1[i + 4] !== "\"") {
						str += "\n";
						i += 2;
					}
					str += indent;
					if (json$1[i + 2] === " ") str += "\\";
					i += 1;
					start = i + 1;
				}
				break;
			default: i += 1;
		}
	}
	str = start ? str + json$1.slice(start) : json$1;
	return implicitKey ? str : foldFlowLines(str, indent, FOLD_QUOTED, getFoldOptions(ctx, false));
}
function singleQuotedString(value, ctx) {
	if (ctx.options.singleQuote === false || ctx.implicitKey && value.includes("\n") || /[ \t]\n|\n[ \t]/.test(value)) return doubleQuotedString(value, ctx);
	const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
	const res = "'" + value.replace(/'/g, "''").replace(/\n+/g, `$&\n${indent}`) + "'";
	return ctx.implicitKey ? res : foldFlowLines(res, indent, FOLD_FLOW, getFoldOptions(ctx, false));
}
function quotedString(value, ctx) {
	const { singleQuote } = ctx.options;
	let qs;
	if (singleQuote === false) qs = doubleQuotedString;
	else {
		const hasDouble = value.includes("\"");
		const hasSingle = value.includes("'");
		if (hasDouble && !hasSingle) qs = singleQuotedString;
		else if (hasSingle && !hasDouble) qs = doubleQuotedString;
		else qs = singleQuote ? singleQuotedString : doubleQuotedString;
	}
	return qs(value, ctx);
}
var blockEndNewlines;
try {
	blockEndNewlines = new RegExp("(^|(?<!\n))\n+(?!\n|$)", "g");
} catch {
	blockEndNewlines = /\n+(?!\n|$)/g;
}
function blockString({ comment, type, value }, ctx, onComment, onChompKeep) {
	const { blockQuote, commentString, lineWidth } = ctx.options;
	if (!blockQuote || /\n[\t ]+$/.test(value)) return quotedString(value, ctx);
	const indent = ctx.indent || (ctx.forceBlockIndent || containsDocumentMarker(value) ? "  " : "");
	const literal = blockQuote === "literal" ? true : blockQuote === "folded" || type === Scalar.BLOCK_FOLDED ? false : type === Scalar.BLOCK_LITERAL ? true : !lineLengthOverLimit(value, lineWidth, indent.length);
	if (!value) return literal ? "|\n" : ">\n";
	let chomp;
	let endStart;
	for (endStart = value.length; endStart > 0; --endStart) {
		const ch = value[endStart - 1];
		if (ch !== "\n" && ch !== "	" && ch !== " ") break;
	}
	let end = value.substring(endStart);
	const endNlPos = end.indexOf("\n");
	if (endNlPos === -1) chomp = "-";
	else if (value === end || endNlPos !== end.length - 1) {
		chomp = "+";
		if (onChompKeep) onChompKeep();
	} else chomp = "";
	if (end) {
		value = value.slice(0, -end.length);
		if (end[end.length - 1] === "\n") end = end.slice(0, -1);
		end = end.replace(blockEndNewlines, `$&${indent}`);
	}
	let startWithSpace = false;
	let startEnd;
	let startNlPos = -1;
	for (startEnd = 0; startEnd < value.length; ++startEnd) {
		const ch = value[startEnd];
		if (ch === " ") startWithSpace = true;
		else if (ch === "\n") startNlPos = startEnd;
		else break;
	}
	let start = value.substring(0, startNlPos < startEnd ? startNlPos + 1 : startEnd);
	if (start) {
		value = value.substring(start.length);
		start = start.replace(/\n+/g, `$&${indent}`);
	}
	let header = (startWithSpace ? indent ? "2" : "1" : "") + chomp;
	if (comment) {
		header += " " + commentString(comment.replace(/ ?[\r\n]+/g, " "));
		if (onComment) onComment();
	}
	if (!literal) {
		const foldedValue = value.replace(/\n+/g, "\n$&").replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${indent}`);
		let literalFallback = false;
		const foldOptions = getFoldOptions(ctx, true);
		if (blockQuote !== "folded" && type !== Scalar.BLOCK_FOLDED) foldOptions.onOverflow = () => {
			literalFallback = true;
		};
		const body = foldFlowLines(`${start}${foldedValue}${end}`, indent, FOLD_BLOCK, foldOptions);
		if (!literalFallback) return `>${header}\n${indent}${body}`;
	}
	value = value.replace(/\n+/g, `$&${indent}`);
	return `|${header}\n${indent}${start}${value}${end}`;
}
function plainString(item, ctx, onComment, onChompKeep) {
	const { type, value } = item;
	const { actualString, implicitKey, indent, indentStep, inFlow } = ctx;
	if (implicitKey && value.includes("\n") || inFlow && /[[\]{},]/.test(value)) return quotedString(value, ctx);
	if (/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(value)) return implicitKey || inFlow || !value.includes("\n") ? quotedString(value, ctx) : blockString(item, ctx, onComment, onChompKeep);
	if (!implicitKey && !inFlow && type !== Scalar.PLAIN && value.includes("\n")) return blockString(item, ctx, onComment, onChompKeep);
	if (containsDocumentMarker(value)) {
		if (indent === "") {
			ctx.forceBlockIndent = true;
			return blockString(item, ctx, onComment, onChompKeep);
		} else if (implicitKey && indent === indentStep) return quotedString(value, ctx);
	}
	const str = value.replace(/\n+/g, `$&\n${indent}`);
	if (actualString) {
		const test = (tag) => tag.default && tag.tag !== "tag:yaml.org,2002:str" && tag.test?.test(str);
		const { compat, tags: tags$1 } = ctx.doc.schema;
		if (tags$1.some(test) || compat?.some(test)) return quotedString(value, ctx);
	}
	return implicitKey ? str : foldFlowLines(str, indent, FOLD_FLOW, getFoldOptions(ctx, false));
}
function stringifyString(item, ctx, onComment, onChompKeep) {
	const { implicitKey, inFlow } = ctx;
	const ss = typeof item.value === "string" ? item : Object.assign({}, item, { value: String(item.value) });
	let { type } = item;
	if (type !== Scalar.QUOTE_DOUBLE) {
		if (/[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(ss.value)) type = Scalar.QUOTE_DOUBLE;
	}
	const _stringify = (_type) => {
		switch (_type) {
			case Scalar.BLOCK_FOLDED:
			case Scalar.BLOCK_LITERAL: return implicitKey || inFlow ? quotedString(ss.value, ctx) : blockString(ss, ctx, onComment, onChompKeep);
			case Scalar.QUOTE_DOUBLE: return doubleQuotedString(ss.value, ctx);
			case Scalar.QUOTE_SINGLE: return singleQuotedString(ss.value, ctx);
			case Scalar.PLAIN: return plainString(ss, ctx, onComment, onChompKeep);
			default: return null;
		}
	};
	let res = _stringify(type);
	if (res === null) {
		const { defaultKeyType, defaultStringType } = ctx.options;
		const t = implicitKey && defaultKeyType || defaultStringType;
		res = _stringify(t);
		if (res === null) throw new Error(`Unsupported default string type ${t}`);
	}
	return res;
}
function createStringifyContext(doc, options) {
	const opt = Object.assign({
		blockQuote: true,
		commentString: stringifyComment,
		defaultKeyType: null,
		defaultStringType: "PLAIN",
		directives: null,
		doubleQuotedAsJSON: false,
		doubleQuotedMinMultiLineLength: 40,
		falseStr: "false",
		flowCollectionPadding: true,
		indentSeq: true,
		lineWidth: 80,
		minContentWidth: 20,
		nullStr: "null",
		simpleKeys: false,
		singleQuote: null,
		trueStr: "true",
		verifyAliasOrder: true
	}, doc.schema.toStringOptions, options);
	let inFlow;
	switch (opt.collectionStyle) {
		case "block":
			inFlow = false;
			break;
		case "flow":
			inFlow = true;
			break;
		default: inFlow = null;
	}
	return {
		anchors: /* @__PURE__ */ new Set(),
		doc,
		flowCollectionPadding: opt.flowCollectionPadding ? " " : "",
		indent: "",
		indentStep: typeof opt.indent === "number" ? " ".repeat(opt.indent) : "  ",
		inFlow,
		options: opt
	};
}
function getTagObject(tags$1, item) {
	if (item.tag) {
		const match = tags$1.filter((t) => t.tag === item.tag);
		if (match.length > 0) return match.find((t) => t.format === item.format) ?? match[0];
	}
	let tagObj = void 0;
	let obj;
	if (isScalar(item)) {
		obj = item.value;
		let match = tags$1.filter((t) => t.identify?.(obj));
		if (match.length > 1) {
			const testMatch = match.filter((t) => t.test);
			if (testMatch.length > 0) match = testMatch;
		}
		tagObj = match.find((t) => t.format === item.format) ?? match.find((t) => !t.format);
	} else {
		obj = item;
		tagObj = tags$1.find((t) => t.nodeClass && obj instanceof t.nodeClass);
	}
	if (!tagObj) {
		const name = obj?.constructor?.name ?? (obj === null ? "null" : typeof obj);
		throw new Error(`Tag not resolved for ${name} value`);
	}
	return tagObj;
}
function stringifyProps(node, tagObj, { anchors, doc }) {
	if (!doc.directives) return "";
	const props = [];
	const anchor = (isScalar(node) || isCollection(node)) && node.anchor;
	if (anchor && anchorIsValid(anchor)) {
		anchors.add(anchor);
		props.push(`&${anchor}`);
	}
	const tag = node.tag ?? (tagObj.default ? null : tagObj.tag);
	if (tag) props.push(doc.directives.tagString(tag));
	return props.join(" ");
}
function stringify$2(item, ctx, onComment, onChompKeep) {
	if (isPair(item)) return item.toString(ctx, onComment, onChompKeep);
	if (isAlias(item)) {
		if (ctx.doc.directives) return item.toString(ctx);
		if (ctx.resolvedAliases?.has(item)) throw new TypeError(`Cannot stringify circular structure without alias nodes`);
		else {
			if (ctx.resolvedAliases) ctx.resolvedAliases.add(item);
			else ctx.resolvedAliases = new Set([item]);
			item = item.resolve(ctx.doc);
		}
	}
	let tagObj = void 0;
	const node = isNode(item) ? item : ctx.doc.createNode(item, { onTagObj: (o) => tagObj = o });
	tagObj ?? (tagObj = getTagObject(ctx.doc.schema.tags, node));
	const props = stringifyProps(node, tagObj, ctx);
	if (props.length > 0) ctx.indentAtStart = (ctx.indentAtStart ?? 0) + props.length + 1;
	const str = typeof tagObj.stringify === "function" ? tagObj.stringify(node, ctx, onComment, onChompKeep) : isScalar(node) ? stringifyString(node, ctx, onComment, onChompKeep) : node.toString(ctx, onComment, onChompKeep);
	if (!props) return str;
	return isScalar(node) || str[0] === "{" || str[0] === "[" ? `${props} ${str}` : `${props}\n${ctx.indent}${str}`;
}
function stringifyPair({ key, value }, ctx, onComment, onChompKeep) {
	const { allNullValues, doc, indent, indentStep, options: { commentString, indentSeq, simpleKeys } } = ctx;
	let keyComment = isNode(key) && key.comment || null;
	if (simpleKeys) {
		if (keyComment) throw new Error("With simple keys, key nodes cannot have comments");
		if (isCollection(key) || !isNode(key) && typeof key === "object") throw new Error("With simple keys, collection cannot be used as a key value");
	}
	let explicitKey = !simpleKeys && (!key || keyComment && value == null && !ctx.inFlow || isCollection(key) || (isScalar(key) ? key.type === Scalar.BLOCK_FOLDED || key.type === Scalar.BLOCK_LITERAL : typeof key === "object"));
	ctx = Object.assign({}, ctx, {
		allNullValues: false,
		implicitKey: !explicitKey && (simpleKeys || !allNullValues),
		indent: indent + indentStep
	});
	let keyCommentDone = false;
	let chompKeep = false;
	let str = stringify$2(key, ctx, () => keyCommentDone = true, () => chompKeep = true);
	if (!explicitKey && !ctx.inFlow && str.length > 1024) {
		if (simpleKeys) throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
		explicitKey = true;
	}
	if (ctx.inFlow) {
		if (allNullValues || value == null) {
			if (keyCommentDone && onComment) onComment();
			return str === "" ? "?" : explicitKey ? `? ${str}` : str;
		}
	} else if (allNullValues && !simpleKeys || value == null && explicitKey) {
		str = `? ${str}`;
		if (keyComment && !keyCommentDone) str += lineComment(str, ctx.indent, commentString(keyComment));
		else if (chompKeep && onChompKeep) onChompKeep();
		return str;
	}
	if (keyCommentDone) keyComment = null;
	if (explicitKey) {
		if (keyComment) str += lineComment(str, ctx.indent, commentString(keyComment));
		str = `? ${str}\n${indent}:`;
	} else {
		str = `${str}:`;
		if (keyComment) str += lineComment(str, ctx.indent, commentString(keyComment));
	}
	let vsb, vcb, valueComment;
	if (isNode(value)) {
		vsb = !!value.spaceBefore;
		vcb = value.commentBefore;
		valueComment = value.comment;
	} else {
		vsb = false;
		vcb = null;
		valueComment = null;
		if (value && typeof value === "object") value = doc.createNode(value);
	}
	ctx.implicitKey = false;
	if (!explicitKey && !keyComment && isScalar(value)) ctx.indentAtStart = str.length + 1;
	chompKeep = false;
	if (!indentSeq && indentStep.length >= 2 && !ctx.inFlow && !explicitKey && isSeq(value) && !value.flow && !value.tag && !value.anchor) ctx.indent = ctx.indent.substring(2);
	let valueCommentDone = false;
	const valueStr = stringify$2(value, ctx, () => valueCommentDone = true, () => chompKeep = true);
	let ws = " ";
	if (keyComment || vsb || vcb) {
		ws = vsb ? "\n" : "";
		if (vcb) {
			const cs = commentString(vcb);
			ws += `\n${indentComment(cs, ctx.indent)}`;
		}
		if (valueStr === "" && !ctx.inFlow) {
			if (ws === "\n") ws = "\n\n";
		} else ws += `\n${ctx.indent}`;
	} else if (!explicitKey && isCollection(value)) {
		const vs0 = valueStr[0];
		const nl0 = valueStr.indexOf("\n");
		const hasNewline = nl0 !== -1;
		const flow = ctx.inFlow ?? value.flow ?? value.items.length === 0;
		if (hasNewline || !flow) {
			let hasPropsLine = false;
			if (hasNewline && (vs0 === "&" || vs0 === "!")) {
				let sp0 = valueStr.indexOf(" ");
				if (vs0 === "&" && sp0 !== -1 && sp0 < nl0 && valueStr[sp0 + 1] === "!") sp0 = valueStr.indexOf(" ", sp0 + 1);
				if (sp0 === -1 || nl0 < sp0) hasPropsLine = true;
			}
			if (!hasPropsLine) ws = `\n${ctx.indent}`;
		}
	} else if (valueStr === "" || valueStr[0] === "\n") ws = "";
	str += ws + valueStr;
	if (ctx.inFlow) {
		if (valueCommentDone && onComment) onComment();
	} else if (valueComment && !valueCommentDone) str += lineComment(str, ctx.indent, commentString(valueComment));
	else if (chompKeep && onChompKeep) onChompKeep();
	return str;
}
function warn(logLevel, warning) {
	if (logLevel === "debug" || logLevel === "warn") console.warn(warning);
}
var MERGE_KEY = "<<";
var merge = {
	identify: (value) => value === MERGE_KEY || typeof value === "symbol" && value.description === MERGE_KEY,
	default: "key",
	tag: "tag:yaml.org,2002:merge",
	test: /^<<$/,
	resolve: () => Object.assign(new Scalar(Symbol(MERGE_KEY)), { addToJSMap: addMergeToJSMap }),
	stringify: () => MERGE_KEY
};
var isMergeKey = (ctx, key) => (merge.identify(key) || isScalar(key) && (!key.type || key.type === Scalar.PLAIN) && merge.identify(key.value)) && ctx?.doc.schema.tags.some((tag) => tag.tag === merge.tag && tag.default);
function addMergeToJSMap(ctx, map$2, value) {
	value = ctx && isAlias(value) ? value.resolve(ctx.doc) : value;
	if (isSeq(value)) for (const it of value.items) mergeValue(ctx, map$2, it);
	else if (Array.isArray(value)) for (const it of value) mergeValue(ctx, map$2, it);
	else mergeValue(ctx, map$2, value);
}
function mergeValue(ctx, map$2, value) {
	const source = ctx && isAlias(value) ? value.resolve(ctx.doc) : value;
	if (!isMap(source)) throw new Error("Merge sources must be maps or map aliases");
	const srcMap = source.toJSON(null, ctx, Map);
	for (const [key, value$1] of srcMap) if (map$2 instanceof Map) {
		if (!map$2.has(key)) map$2.set(key, value$1);
	} else if (map$2 instanceof Set) map$2.add(key);
	else if (!Object.prototype.hasOwnProperty.call(map$2, key)) Object.defineProperty(map$2, key, {
		value: value$1,
		writable: true,
		enumerable: true,
		configurable: true
	});
	return map$2;
}
function addPairToJSMap(ctx, map$2, { key, value }) {
	if (isNode(key) && key.addToJSMap) key.addToJSMap(ctx, map$2, value);
	else if (isMergeKey(ctx, key)) addMergeToJSMap(ctx, map$2, value);
	else {
		const jsKey = toJS(key, "", ctx);
		if (map$2 instanceof Map) map$2.set(jsKey, toJS(value, jsKey, ctx));
		else if (map$2 instanceof Set) map$2.add(jsKey);
		else {
			const stringKey = stringifyKey(key, jsKey, ctx);
			const jsValue = toJS(value, stringKey, ctx);
			if (stringKey in map$2) Object.defineProperty(map$2, stringKey, {
				value: jsValue,
				writable: true,
				enumerable: true,
				configurable: true
			});
			else map$2[stringKey] = jsValue;
		}
	}
	return map$2;
}
function stringifyKey(key, jsKey, ctx) {
	if (jsKey === null) return "";
	if (typeof jsKey !== "object") return String(jsKey);
	if (isNode(key) && ctx?.doc) {
		const strCtx = createStringifyContext(ctx.doc, {});
		strCtx.anchors = /* @__PURE__ */ new Set();
		for (const node of ctx.anchors.keys()) strCtx.anchors.add(node.anchor);
		strCtx.inFlow = true;
		strCtx.inStringifyKey = true;
		const strKey = key.toString(strCtx);
		if (!ctx.mapKeyWarned) {
			let jsonStr = JSON.stringify(strKey);
			if (jsonStr.length > 40) jsonStr = jsonStr.substring(0, 36) + "...\"";
			warn(ctx.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${jsonStr}. Set mapAsMap: true to use object keys.`);
			ctx.mapKeyWarned = true;
		}
		return strKey;
	}
	return JSON.stringify(jsKey);
}
function createPair(key, value, ctx) {
	return new Pair(createNode(key, void 0, ctx), createNode(value, void 0, ctx));
}
var Pair = class Pair {
	constructor(key, value = null) {
		Object.defineProperty(this, NODE_TYPE, { value: PAIR });
		this.key = key;
		this.value = value;
	}
	clone(schema$3) {
		let { key, value } = this;
		if (isNode(key)) key = key.clone(schema$3);
		if (isNode(value)) value = value.clone(schema$3);
		return new Pair(key, value);
	}
	toJSON(_, ctx) {
		return addPairToJSMap(ctx, ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {}, this);
	}
	toString(ctx, onComment, onChompKeep) {
		return ctx?.doc ? stringifyPair(this, ctx, onComment, onChompKeep) : JSON.stringify(this);
	}
};
function stringifyCollection(collection, ctx, options) {
	return (ctx.inFlow ?? collection.flow ? stringifyFlowCollection : stringifyBlockCollection)(collection, ctx, options);
}
function stringifyBlockCollection({ comment, items }, ctx, { blockItemPrefix, flowChars, itemIndent, onChompKeep, onComment }) {
	const { indent, options: { commentString } } = ctx;
	const itemCtx = Object.assign({}, ctx, {
		indent: itemIndent,
		type: null
	});
	let chompKeep = false;
	const lines = [];
	for (let i = 0; i < items.length; ++i) {
		const item = items[i];
		let comment$1 = null;
		if (isNode(item)) {
			if (!chompKeep && item.spaceBefore) lines.push("");
			addCommentBefore(ctx, lines, item.commentBefore, chompKeep);
			if (item.comment) comment$1 = item.comment;
		} else if (isPair(item)) {
			const ik = isNode(item.key) ? item.key : null;
			if (ik) {
				if (!chompKeep && ik.spaceBefore) lines.push("");
				addCommentBefore(ctx, lines, ik.commentBefore, chompKeep);
			}
		}
		chompKeep = false;
		let str$1 = stringify$2(item, itemCtx, () => comment$1 = null, () => chompKeep = true);
		if (comment$1) str$1 += lineComment(str$1, itemIndent, commentString(comment$1));
		if (chompKeep && comment$1) chompKeep = false;
		lines.push(blockItemPrefix + str$1);
	}
	let str;
	if (lines.length === 0) str = flowChars.start + flowChars.end;
	else {
		str = lines[0];
		for (let i = 1; i < lines.length; ++i) {
			const line = lines[i];
			str += line ? `\n${indent}${line}` : "\n";
		}
	}
	if (comment) {
		str += "\n" + indentComment(commentString(comment), indent);
		if (onComment) onComment();
	} else if (chompKeep && onChompKeep) onChompKeep();
	return str;
}
function stringifyFlowCollection({ items }, ctx, { flowChars, itemIndent }) {
	const { indent, indentStep, flowCollectionPadding: fcPadding, options: { commentString } } = ctx;
	itemIndent += indentStep;
	const itemCtx = Object.assign({}, ctx, {
		indent: itemIndent,
		inFlow: true,
		type: null
	});
	let reqNewline = false;
	let linesAtValue = 0;
	const lines = [];
	for (let i = 0; i < items.length; ++i) {
		const item = items[i];
		let comment = null;
		if (isNode(item)) {
			if (item.spaceBefore) lines.push("");
			addCommentBefore(ctx, lines, item.commentBefore, false);
			if (item.comment) comment = item.comment;
		} else if (isPair(item)) {
			const ik = isNode(item.key) ? item.key : null;
			if (ik) {
				if (ik.spaceBefore) lines.push("");
				addCommentBefore(ctx, lines, ik.commentBefore, false);
				if (ik.comment) reqNewline = true;
			}
			const iv = isNode(item.value) ? item.value : null;
			if (iv) {
				if (iv.comment) comment = iv.comment;
				if (iv.commentBefore) reqNewline = true;
			} else if (item.value == null && ik?.comment) comment = ik.comment;
		}
		if (comment) reqNewline = true;
		let str = stringify$2(item, itemCtx, () => comment = null);
		if (i < items.length - 1) str += ",";
		if (comment) str += lineComment(str, itemIndent, commentString(comment));
		if (!reqNewline && (lines.length > linesAtValue || str.includes("\n"))) reqNewline = true;
		lines.push(str);
		linesAtValue = lines.length;
	}
	const { start, end } = flowChars;
	if (lines.length === 0) return start + end;
	else {
		if (!reqNewline) {
			const len = lines.reduce((sum$1, line) => sum$1 + line.length + 2, 2);
			reqNewline = ctx.options.lineWidth > 0 && len > ctx.options.lineWidth;
		}
		if (reqNewline) {
			let str = start;
			for (const line of lines) str += line ? `\n${indentStep}${indent}${line}` : "\n";
			return `${str}\n${indent}${end}`;
		} else return `${start}${fcPadding}${lines.join(" ")}${fcPadding}${end}`;
	}
}
function addCommentBefore({ indent, options: { commentString } }, lines, comment, chompKeep) {
	if (comment && chompKeep) comment = comment.replace(/^\n+/, "");
	if (comment) {
		const ic = indentComment(commentString(comment), indent);
		lines.push(ic.trimStart());
	}
}
function findPair(items, key) {
	const k = isScalar(key) ? key.value : key;
	for (const it of items) if (isPair(it)) {
		if (it.key === key || it.key === k) return it;
		if (isScalar(it.key) && it.key.value === k) return it;
	}
}
var YAMLMap = class extends Collection {
	static get tagName() {
		return "tag:yaml.org,2002:map";
	}
	constructor(schema$3) {
		super(MAP, schema$3);
		this.items = [];
	}
	static from(schema$3, obj, ctx) {
		const { keepUndefined, replacer } = ctx;
		const map$2 = new this(schema$3);
		const add = (key, value) => {
			if (typeof replacer === "function") value = replacer.call(obj, key, value);
			else if (Array.isArray(replacer) && !replacer.includes(key)) return;
			if (value !== void 0 || keepUndefined) map$2.items.push(createPair(key, value, ctx));
		};
		if (obj instanceof Map) for (const [key, value] of obj) add(key, value);
		else if (obj && typeof obj === "object") for (const key of Object.keys(obj)) add(key, obj[key]);
		if (typeof schema$3.sortMapEntries === "function") map$2.items.sort(schema$3.sortMapEntries);
		return map$2;
	}
	add(pair, overwrite) {
		let _pair;
		if (isPair(pair)) _pair = pair;
		else if (!pair || typeof pair !== "object" || !("key" in pair)) _pair = new Pair(pair, pair?.value);
		else _pair = new Pair(pair.key, pair.value);
		const prev = findPair(this.items, _pair.key);
		const sortEntries = this.schema?.sortMapEntries;
		if (prev) {
			if (!overwrite) throw new Error(`Key ${_pair.key} already set`);
			if (isScalar(prev.value) && isScalarValue(_pair.value)) prev.value.value = _pair.value;
			else prev.value = _pair.value;
		} else if (sortEntries) {
			const i = this.items.findIndex((item) => sortEntries(_pair, item) < 0);
			if (i === -1) this.items.push(_pair);
			else this.items.splice(i, 0, _pair);
		} else this.items.push(_pair);
	}
	delete(key) {
		const it = findPair(this.items, key);
		if (!it) return false;
		return this.items.splice(this.items.indexOf(it), 1).length > 0;
	}
	get(key, keepScalar) {
		const node = findPair(this.items, key)?.value;
		return (!keepScalar && isScalar(node) ? node.value : node) ?? void 0;
	}
	has(key) {
		return !!findPair(this.items, key);
	}
	set(key, value) {
		this.add(new Pair(key, value), true);
	}
	toJSON(_, ctx, Type) {
		const map$2 = Type ? new Type() : ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
		if (ctx?.onCreate) ctx.onCreate(map$2);
		for (const item of this.items) addPairToJSMap(ctx, map$2, item);
		return map$2;
	}
	toString(ctx, onComment, onChompKeep) {
		if (!ctx) return JSON.stringify(this);
		for (const item of this.items) if (!isPair(item)) throw new Error(`Map items must all be pairs; found ${JSON.stringify(item)} instead`);
		if (!ctx.allNullValues && this.hasAllNullValues(false)) ctx = Object.assign({}, ctx, { allNullValues: true });
		return stringifyCollection(this, ctx, {
			blockItemPrefix: "",
			flowChars: {
				start: "{",
				end: "}"
			},
			itemIndent: ctx.indent || "",
			onChompKeep,
			onComment
		});
	}
};
var map$1 = {
	collection: "map",
	default: true,
	nodeClass: YAMLMap,
	tag: "tag:yaml.org,2002:map",
	resolve(map$2, onError) {
		if (!isMap(map$2)) onError("Expected a mapping for this tag");
		return map$2;
	},
	createNode: (schema$3, obj, ctx) => YAMLMap.from(schema$3, obj, ctx)
};
var YAMLSeq = class extends Collection {
	static get tagName() {
		return "tag:yaml.org,2002:seq";
	}
	constructor(schema$3) {
		super(SEQ, schema$3);
		this.items = [];
	}
	add(value) {
		this.items.push(value);
	}
	delete(key) {
		const idx = asItemIndex(key);
		if (typeof idx !== "number") return false;
		return this.items.splice(idx, 1).length > 0;
	}
	get(key, keepScalar) {
		const idx = asItemIndex(key);
		if (typeof idx !== "number") return void 0;
		const it = this.items[idx];
		return !keepScalar && isScalar(it) ? it.value : it;
	}
	has(key) {
		const idx = asItemIndex(key);
		return typeof idx === "number" && idx < this.items.length;
	}
	set(key, value) {
		const idx = asItemIndex(key);
		if (typeof idx !== "number") throw new Error(`Expected a valid index, not ${key}.`);
		const prev = this.items[idx];
		if (isScalar(prev) && isScalarValue(value)) prev.value = value;
		else this.items[idx] = value;
	}
	toJSON(_, ctx) {
		const seq$1 = [];
		if (ctx?.onCreate) ctx.onCreate(seq$1);
		let i = 0;
		for (const item of this.items) seq$1.push(toJS(item, String(i++), ctx));
		return seq$1;
	}
	toString(ctx, onComment, onChompKeep) {
		if (!ctx) return JSON.stringify(this);
		return stringifyCollection(this, ctx, {
			blockItemPrefix: "- ",
			flowChars: {
				start: "[",
				end: "]"
			},
			itemIndent: (ctx.indent || "") + "  ",
			onChompKeep,
			onComment
		});
	}
	static from(schema$3, obj, ctx) {
		const { replacer } = ctx;
		const seq$1 = new this(schema$3);
		if (obj && Symbol.iterator in Object(obj)) {
			let i = 0;
			for (let it of obj) {
				if (typeof replacer === "function") {
					const key = obj instanceof Set ? it : String(i++);
					it = replacer.call(obj, key, it);
				}
				seq$1.items.push(createNode(it, void 0, ctx));
			}
		}
		return seq$1;
	}
};
function asItemIndex(key) {
	let idx = isScalar(key) ? key.value : key;
	if (idx && typeof idx === "string") idx = Number(idx);
	return typeof idx === "number" && Number.isInteger(idx) && idx >= 0 ? idx : null;
}
var seq = {
	collection: "seq",
	default: true,
	nodeClass: YAMLSeq,
	tag: "tag:yaml.org,2002:seq",
	resolve(seq$1, onError) {
		if (!isSeq(seq$1)) onError("Expected a sequence for this tag");
		return seq$1;
	},
	createNode: (schema$3, obj, ctx) => YAMLSeq.from(schema$3, obj, ctx)
};
var string = {
	identify: (value) => typeof value === "string",
	default: true,
	tag: "tag:yaml.org,2002:str",
	resolve: (str) => str,
	stringify(item, ctx, onComment, onChompKeep) {
		ctx = Object.assign({ actualString: true }, ctx);
		return stringifyString(item, ctx, onComment, onChompKeep);
	}
};
var nullTag = {
	identify: (value) => value == null,
	createNode: () => new Scalar(null),
	default: true,
	tag: "tag:yaml.org,2002:null",
	test: /^(?:~|[Nn]ull|NULL)?$/,
	resolve: () => new Scalar(null),
	stringify: ({ source }, ctx) => typeof source === "string" && nullTag.test.test(source) ? source : ctx.options.nullStr
};
var boolTag = {
	identify: (value) => typeof value === "boolean",
	default: true,
	tag: "tag:yaml.org,2002:bool",
	test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
	resolve: (str) => new Scalar(str[0] === "t" || str[0] === "T"),
	stringify({ source, value }, ctx) {
		if (source && boolTag.test.test(source)) {
			if (value === (source[0] === "t" || source[0] === "T")) return source;
		}
		return value ? ctx.options.trueStr : ctx.options.falseStr;
	}
};
function stringifyNumber({ format: format$1, minFractionDigits, tag, value }) {
	if (typeof value === "bigint") return String(value);
	const num = typeof value === "number" ? value : Number(value);
	if (!isFinite(num)) return isNaN(num) ? ".nan" : num < 0 ? "-.inf" : ".inf";
	let n = JSON.stringify(value);
	if (!format$1 && minFractionDigits && (!tag || tag === "tag:yaml.org,2002:float") && /^\d/.test(n)) {
		let i = n.indexOf(".");
		if (i < 0) {
			i = n.length;
			n += ".";
		}
		let d = minFractionDigits - (n.length - i - 1);
		while (d-- > 0) n += "0";
	}
	return n;
}
var floatNaN = {
	identify: (value) => typeof value === "number",
	default: true,
	tag: "tag:yaml.org,2002:float",
	test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
	resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
	stringify: stringifyNumber
};
var floatExp = {
	identify: (value) => typeof value === "number",
	default: true,
	tag: "tag:yaml.org,2002:float",
	format: "EXP",
	test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
	resolve: (str) => parseFloat(str),
	stringify(node) {
		const num = Number(node.value);
		return isFinite(num) ? num.toExponential() : stringifyNumber(node);
	}
};
var float = {
	identify: (value) => typeof value === "number",
	default: true,
	tag: "tag:yaml.org,2002:float",
	test: /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,
	resolve(str) {
		const node = new Scalar(parseFloat(str));
		const dot = str.indexOf(".");
		if (dot !== -1 && str[str.length - 1] === "0") node.minFractionDigits = str.length - dot - 1;
		return node;
	},
	stringify: stringifyNumber
};
var intIdentify$2 = (value) => typeof value === "bigint" || Number.isInteger(value);
var intResolve$1 = (str, offset$1, radix, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str.substring(offset$1), radix);
function intStringify$1(node, radix, prefix) {
	const { value } = node;
	if (intIdentify$2(value) && value >= 0) return prefix + value.toString(radix);
	return stringifyNumber(node);
}
var intOct = {
	identify: (value) => intIdentify$2(value) && value >= 0,
	default: true,
	tag: "tag:yaml.org,2002:int",
	format: "OCT",
	test: /^0o[0-7]+$/,
	resolve: (str, _onError, opt) => intResolve$1(str, 2, 8, opt),
	stringify: (node) => intStringify$1(node, 8, "0o")
};
var int = {
	identify: intIdentify$2,
	default: true,
	tag: "tag:yaml.org,2002:int",
	test: /^[-+]?[0-9]+$/,
	resolve: (str, _onError, opt) => intResolve$1(str, 0, 10, opt),
	stringify: stringifyNumber
};
var intHex = {
	identify: (value) => intIdentify$2(value) && value >= 0,
	default: true,
	tag: "tag:yaml.org,2002:int",
	format: "HEX",
	test: /^0x[0-9a-fA-F]+$/,
	resolve: (str, _onError, opt) => intResolve$1(str, 2, 16, opt),
	stringify: (node) => intStringify$1(node, 16, "0x")
};
var schema = [
	map$1,
	seq,
	string,
	nullTag,
	boolTag,
	intOct,
	int,
	intHex,
	floatNaN,
	floatExp,
	float
];
function intIdentify$1(value) {
	return typeof value === "bigint" || Number.isInteger(value);
}
var stringifyJSON = ({ value }) => JSON.stringify(value);
var jsonScalars = [
	{
		identify: (value) => typeof value === "string",
		default: true,
		tag: "tag:yaml.org,2002:str",
		resolve: (str) => str,
		stringify: stringifyJSON
	},
	{
		identify: (value) => value == null,
		createNode: () => new Scalar(null),
		default: true,
		tag: "tag:yaml.org,2002:null",
		test: /^null$/,
		resolve: () => null,
		stringify: stringifyJSON
	},
	{
		identify: (value) => typeof value === "boolean",
		default: true,
		tag: "tag:yaml.org,2002:bool",
		test: /^true$|^false$/,
		resolve: (str) => str === "true",
		stringify: stringifyJSON
	},
	{
		identify: intIdentify$1,
		default: true,
		tag: "tag:yaml.org,2002:int",
		test: /^-?(?:0|[1-9][0-9]*)$/,
		resolve: (str, _onError, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str, 10),
		stringify: ({ value }) => intIdentify$1(value) ? value.toString() : JSON.stringify(value)
	},
	{
		identify: (value) => typeof value === "number",
		default: true,
		tag: "tag:yaml.org,2002:float",
		test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
		resolve: (str) => parseFloat(str),
		stringify: stringifyJSON
	}
];
var schema$1 = [map$1, seq].concat(jsonScalars, {
	default: true,
	tag: "",
	test: /^/,
	resolve(str, onError) {
		onError(`Unresolved plain scalar ${JSON.stringify(str)}`);
		return str;
	}
});
var binary = {
	identify: (value) => value instanceof Uint8Array,
	default: false,
	tag: "tag:yaml.org,2002:binary",
	resolve(src, onError) {
		if (typeof atob === "function") {
			const str = atob(src.replace(/[\n\r]/g, ""));
			const buffer = new Uint8Array(str.length);
			for (let i = 0; i < str.length; ++i) buffer[i] = str.charCodeAt(i);
			return buffer;
		} else {
			onError("This environment does not support reading binary tags; either Buffer or atob is required");
			return src;
		}
	},
	stringify({ comment, type, value }, ctx, onComment, onChompKeep) {
		if (!value) return "";
		const buf = value;
		let str;
		if (typeof btoa === "function") {
			let s = "";
			for (let i = 0; i < buf.length; ++i) s += String.fromCharCode(buf[i]);
			str = btoa(s);
		} else throw new Error("This environment does not support writing binary tags; either Buffer or btoa is required");
		type ?? (type = Scalar.BLOCK_LITERAL);
		if (type !== Scalar.QUOTE_DOUBLE) {
			const lineWidth = Math.max(ctx.options.lineWidth - ctx.indent.length, ctx.options.minContentWidth);
			const n = Math.ceil(str.length / lineWidth);
			const lines = new Array(n);
			for (let i = 0, o = 0; i < n; ++i, o += lineWidth) lines[i] = str.substr(o, lineWidth);
			str = lines.join(type === Scalar.BLOCK_LITERAL ? "\n" : " ");
		}
		return stringifyString({
			comment,
			type,
			value: str
		}, ctx, onComment, onChompKeep);
	}
};
function resolvePairs(seq$1, onError) {
	if (isSeq(seq$1)) for (let i = 0; i < seq$1.items.length; ++i) {
		let item = seq$1.items[i];
		if (isPair(item)) continue;
		else if (isMap(item)) {
			if (item.items.length > 1) onError("Each pair must have its own sequence indicator");
			const pair = item.items[0] || new Pair(new Scalar(null));
			if (item.commentBefore) pair.key.commentBefore = pair.key.commentBefore ? `${item.commentBefore}\n${pair.key.commentBefore}` : item.commentBefore;
			if (item.comment) {
				const cn = pair.value ?? pair.key;
				cn.comment = cn.comment ? `${item.comment}\n${cn.comment}` : item.comment;
			}
			item = pair;
		}
		seq$1.items[i] = isPair(item) ? item : new Pair(item);
	}
	else onError("Expected a sequence for this tag");
	return seq$1;
}
function createPairs(schema$3, iterable, ctx) {
	const { replacer } = ctx;
	const pairs$1 = new YAMLSeq(schema$3);
	pairs$1.tag = "tag:yaml.org,2002:pairs";
	let i = 0;
	if (iterable && Symbol.iterator in Object(iterable)) for (let it of iterable) {
		if (typeof replacer === "function") it = replacer.call(iterable, String(i++), it);
		let key, value;
		if (Array.isArray(it)) if (it.length === 2) {
			key = it[0];
			value = it[1];
		} else throw new TypeError(`Expected [key, value] tuple: ${it}`);
		else if (it && it instanceof Object) {
			const keys = Object.keys(it);
			if (keys.length === 1) {
				key = keys[0];
				value = it[key];
			} else throw new TypeError(`Expected tuple with one key, not ${keys.length} keys`);
		} else key = it;
		pairs$1.items.push(createPair(key, value, ctx));
	}
	return pairs$1;
}
var pairs = {
	collection: "seq",
	default: false,
	tag: "tag:yaml.org,2002:pairs",
	resolve: resolvePairs,
	createNode: createPairs
};
var YAMLOMap = class YAMLOMap extends YAMLSeq {
	constructor() {
		super();
		this.add = YAMLMap.prototype.add.bind(this);
		this.delete = YAMLMap.prototype.delete.bind(this);
		this.get = YAMLMap.prototype.get.bind(this);
		this.has = YAMLMap.prototype.has.bind(this);
		this.set = YAMLMap.prototype.set.bind(this);
		this.tag = YAMLOMap.tag;
	}
	toJSON(_, ctx) {
		if (!ctx) return super.toJSON(_);
		const map$2 = /* @__PURE__ */ new Map();
		if (ctx?.onCreate) ctx.onCreate(map$2);
		for (const pair of this.items) {
			let key, value;
			if (isPair(pair)) {
				key = toJS(pair.key, "", ctx);
				value = toJS(pair.value, key, ctx);
			} else key = toJS(pair, "", ctx);
			if (map$2.has(key)) throw new Error("Ordered maps must not include duplicate keys");
			map$2.set(key, value);
		}
		return map$2;
	}
	static from(schema$3, iterable, ctx) {
		const pairs$1 = createPairs(schema$3, iterable, ctx);
		const omap$1 = new this();
		omap$1.items = pairs$1.items;
		return omap$1;
	}
};
YAMLOMap.tag = "tag:yaml.org,2002:omap";
var omap = {
	collection: "seq",
	identify: (value) => value instanceof Map,
	nodeClass: YAMLOMap,
	default: false,
	tag: "tag:yaml.org,2002:omap",
	resolve(seq$1, onError) {
		const pairs$1 = resolvePairs(seq$1, onError);
		const seenKeys = [];
		for (const { key } of pairs$1.items) if (isScalar(key)) if (seenKeys.includes(key.value)) onError(`Ordered maps must not include duplicate keys: ${key.value}`);
		else seenKeys.push(key.value);
		return Object.assign(new YAMLOMap(), pairs$1);
	},
	createNode: (schema$3, iterable, ctx) => YAMLOMap.from(schema$3, iterable, ctx)
};
function boolStringify({ value, source }, ctx) {
	if (source && (value ? trueTag : falseTag).test.test(source)) return source;
	return value ? ctx.options.trueStr : ctx.options.falseStr;
}
var trueTag = {
	identify: (value) => value === true,
	default: true,
	tag: "tag:yaml.org,2002:bool",
	test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
	resolve: () => new Scalar(true),
	stringify: boolStringify
};
var falseTag = {
	identify: (value) => value === false,
	default: true,
	tag: "tag:yaml.org,2002:bool",
	test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/,
	resolve: () => new Scalar(false),
	stringify: boolStringify
};
var floatNaN$1 = {
	identify: (value) => typeof value === "number",
	default: true,
	tag: "tag:yaml.org,2002:float",
	test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
	resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
	stringify: stringifyNumber
};
var floatExp$1 = {
	identify: (value) => typeof value === "number",
	default: true,
	tag: "tag:yaml.org,2002:float",
	format: "EXP",
	test: /^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,
	resolve: (str) => parseFloat(str.replace(/_/g, "")),
	stringify(node) {
		const num = Number(node.value);
		return isFinite(num) ? num.toExponential() : stringifyNumber(node);
	}
};
var float$1 = {
	identify: (value) => typeof value === "number",
	default: true,
	tag: "tag:yaml.org,2002:float",
	test: /^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,
	resolve(str) {
		const node = new Scalar(parseFloat(str.replace(/_/g, "")));
		const dot = str.indexOf(".");
		if (dot !== -1) {
			const f = str.substring(dot + 1).replace(/_/g, "");
			if (f[f.length - 1] === "0") node.minFractionDigits = f.length;
		}
		return node;
	},
	stringify: stringifyNumber
};
var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
function intResolve(str, offset$1, radix, { intAsBigInt }) {
	const sign = str[0];
	if (sign === "-" || sign === "+") offset$1 += 1;
	str = str.substring(offset$1).replace(/_/g, "");
	if (intAsBigInt) {
		switch (radix) {
			case 2:
				str = `0b${str}`;
				break;
			case 8:
				str = `0o${str}`;
				break;
			case 16:
				str = `0x${str}`;
				break;
		}
		const n$1 = BigInt(str);
		return sign === "-" ? BigInt(-1) * n$1 : n$1;
	}
	const n = parseInt(str, radix);
	return sign === "-" ? -1 * n : n;
}
function intStringify(node, radix, prefix) {
	const { value } = node;
	if (intIdentify(value)) {
		const str = value.toString(radix);
		return value < 0 ? "-" + prefix + str.substr(1) : prefix + str;
	}
	return stringifyNumber(node);
}
var intBin = {
	identify: intIdentify,
	default: true,
	tag: "tag:yaml.org,2002:int",
	format: "BIN",
	test: /^[-+]?0b[0-1_]+$/,
	resolve: (str, _onError, opt) => intResolve(str, 2, 2, opt),
	stringify: (node) => intStringify(node, 2, "0b")
};
var intOct$1 = {
	identify: intIdentify,
	default: true,
	tag: "tag:yaml.org,2002:int",
	format: "OCT",
	test: /^[-+]?0[0-7_]+$/,
	resolve: (str, _onError, opt) => intResolve(str, 1, 8, opt),
	stringify: (node) => intStringify(node, 8, "0")
};
var int$1 = {
	identify: intIdentify,
	default: true,
	tag: "tag:yaml.org,2002:int",
	test: /^[-+]?[0-9][0-9_]*$/,
	resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
	stringify: stringifyNumber
};
var intHex$1 = {
	identify: intIdentify,
	default: true,
	tag: "tag:yaml.org,2002:int",
	format: "HEX",
	test: /^[-+]?0x[0-9a-fA-F_]+$/,
	resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
	stringify: (node) => intStringify(node, 16, "0x")
};
var YAMLSet = class YAMLSet extends YAMLMap {
	constructor(schema$3) {
		super(schema$3);
		this.tag = YAMLSet.tag;
	}
	add(key) {
		let pair;
		if (isPair(key)) pair = key;
		else if (key && typeof key === "object" && "key" in key && "value" in key && key.value === null) pair = new Pair(key.key, null);
		else pair = new Pair(key, null);
		if (!findPair(this.items, pair.key)) this.items.push(pair);
	}
	get(key, keepPair) {
		const pair = findPair(this.items, key);
		return !keepPair && isPair(pair) ? isScalar(pair.key) ? pair.key.value : pair.key : pair;
	}
	set(key, value) {
		if (typeof value !== "boolean") throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof value}`);
		const prev = findPair(this.items, key);
		if (prev && !value) this.items.splice(this.items.indexOf(prev), 1);
		else if (!prev && value) this.items.push(new Pair(key));
	}
	toJSON(_, ctx) {
		return super.toJSON(_, ctx, Set);
	}
	toString(ctx, onComment, onChompKeep) {
		if (!ctx) return JSON.stringify(this);
		if (this.hasAllNullValues(true)) return super.toString(Object.assign({}, ctx, { allNullValues: true }), onComment, onChompKeep);
		else throw new Error("Set items must all have null values");
	}
	static from(schema$3, iterable, ctx) {
		const { replacer } = ctx;
		const set$1 = new this(schema$3);
		if (iterable && Symbol.iterator in Object(iterable)) for (let value of iterable) {
			if (typeof replacer === "function") value = replacer.call(iterable, value, value);
			set$1.items.push(createPair(value, null, ctx));
		}
		return set$1;
	}
};
YAMLSet.tag = "tag:yaml.org,2002:set";
var set = {
	collection: "map",
	identify: (value) => value instanceof Set,
	nodeClass: YAMLSet,
	default: false,
	tag: "tag:yaml.org,2002:set",
	createNode: (schema$3, iterable, ctx) => YAMLSet.from(schema$3, iterable, ctx),
	resolve(map$2, onError) {
		if (isMap(map$2)) if (map$2.hasAllNullValues(true)) return Object.assign(new YAMLSet(), map$2);
		else onError("Set items must all have null values");
		else onError("Expected a mapping for this tag");
		return map$2;
	}
};
function parseSexagesimal(str, asBigInt) {
	const sign = str[0];
	const parts = sign === "-" || sign === "+" ? str.substring(1) : str;
	const num = (n) => asBigInt ? BigInt(n) : Number(n);
	const res = parts.replace(/_/g, "").split(":").reduce((res$1, p) => res$1 * num(60) + num(p), num(0));
	return sign === "-" ? num(-1) * res : res;
}
function stringifySexagesimal(node) {
	let { value } = node;
	let num = (n) => n;
	if (typeof value === "bigint") num = (n) => BigInt(n);
	else if (isNaN(value) || !isFinite(value)) return stringifyNumber(node);
	let sign = "";
	if (value < 0) {
		sign = "-";
		value *= num(-1);
	}
	const _60 = num(60);
	const parts = [value % _60];
	if (value < 60) parts.unshift(0);
	else {
		value = (value - parts[0]) / _60;
		parts.unshift(value % _60);
		if (value >= 60) {
			value = (value - parts[0]) / _60;
			parts.unshift(value);
		}
	}
	return sign + parts.map((n) => String(n).padStart(2, "0")).join(":").replace(/000000\d*$/, "");
}
var intTime = {
	identify: (value) => typeof value === "bigint" || Number.isInteger(value),
	default: true,
	tag: "tag:yaml.org,2002:int",
	format: "TIME",
	test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/,
	resolve: (str, _onError, { intAsBigInt }) => parseSexagesimal(str, intAsBigInt),
	stringify: stringifySexagesimal
};
var floatTime = {
	identify: (value) => typeof value === "number",
	default: true,
	tag: "tag:yaml.org,2002:float",
	format: "TIME",
	test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,
	resolve: (str) => parseSexagesimal(str, false),
	stringify: stringifySexagesimal
};
var timestamp = {
	identify: (value) => value instanceof Date,
	default: true,
	tag: "tag:yaml.org,2002:timestamp",
	test: RegExp("^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})(?:(?:t|T|[ \\t]+)([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?)?$"),
	resolve(str) {
		const match = str.match(timestamp.test);
		if (!match) throw new Error("!!timestamp expects a date, starting with yyyy-mm-dd");
		const [, year, month, day, hour, minute, second] = match.map(Number);
		const millisec = match[7] ? Number((match[7] + "00").substr(1, 3)) : 0;
		let date$1 = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0, millisec);
		const tz = match[8];
		if (tz && tz !== "Z") {
			let d = parseSexagesimal(tz, false);
			if (Math.abs(d) < 30) d *= 60;
			date$1 -= 6e4 * d;
		}
		return new Date(date$1);
	},
	stringify: ({ value }) => value?.toISOString().replace(/(T00:00:00)?\.000Z$/, "") ?? ""
};
var schema$2 = [
	map$1,
	seq,
	string,
	nullTag,
	trueTag,
	falseTag,
	intBin,
	intOct$1,
	int$1,
	intHex$1,
	floatNaN$1,
	floatExp$1,
	float$1,
	binary,
	merge,
	omap,
	pairs,
	set,
	intTime,
	floatTime,
	timestamp
];
var schemas = new Map([
	["core", schema],
	["failsafe", [
		map$1,
		seq,
		string
	]],
	["json", schema$1],
	["yaml11", schema$2],
	["yaml-1.1", schema$2]
]);
var tagsByName = {
	binary,
	bool: boolTag,
	float,
	floatExp,
	floatNaN,
	floatTime,
	int,
	intHex,
	intOct,
	intTime,
	map: map$1,
	merge,
	null: nullTag,
	omap,
	pairs,
	seq,
	set,
	timestamp
};
var coreKnownTags = {
	"tag:yaml.org,2002:binary": binary,
	"tag:yaml.org,2002:merge": merge,
	"tag:yaml.org,2002:omap": omap,
	"tag:yaml.org,2002:pairs": pairs,
	"tag:yaml.org,2002:set": set,
	"tag:yaml.org,2002:timestamp": timestamp
};
function getTags(customTags, schemaName, addMergeTag) {
	const schemaTags = schemas.get(schemaName);
	if (schemaTags && !customTags) return addMergeTag && !schemaTags.includes(merge) ? schemaTags.concat(merge) : schemaTags.slice();
	let tags$1 = schemaTags;
	if (!tags$1) if (Array.isArray(customTags)) tags$1 = [];
	else {
		const keys = Array.from(schemas.keys()).filter((key) => key !== "yaml11").map((key) => JSON.stringify(key)).join(", ");
		throw new Error(`Unknown schema "${schemaName}"; use one of ${keys} or define customTags array`);
	}
	if (Array.isArray(customTags)) for (const tag of customTags) tags$1 = tags$1.concat(tag);
	else if (typeof customTags === "function") tags$1 = customTags(tags$1.slice());
	if (addMergeTag) tags$1 = tags$1.concat(merge);
	return tags$1.reduce((tags$2, tag) => {
		const tagObj = typeof tag === "string" ? tagsByName[tag] : tag;
		if (!tagObj) {
			const tagName = JSON.stringify(tag);
			const keys = Object.keys(tagsByName).map((key) => JSON.stringify(key)).join(", ");
			throw new Error(`Unknown custom tag ${tagName}; use one of ${keys}`);
		}
		if (!tags$2.includes(tagObj)) tags$2.push(tagObj);
		return tags$2;
	}, []);
}
var sortMapEntriesByKey = (a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
var Schema = class Schema {
	constructor({ compat, customTags, merge: merge$1, resolveKnownTags, schema: schema$3, sortMapEntries, toStringDefaults }) {
		this.compat = Array.isArray(compat) ? getTags(compat, "compat") : compat ? getTags(null, compat) : null;
		this.name = typeof schema$3 === "string" && schema$3 || "core";
		this.knownTags = resolveKnownTags ? coreKnownTags : {};
		this.tags = getTags(customTags, this.name, merge$1);
		this.toStringOptions = toStringDefaults ?? null;
		Object.defineProperty(this, MAP, { value: map$1 });
		Object.defineProperty(this, SCALAR$1, { value: string });
		Object.defineProperty(this, SEQ, { value: seq });
		this.sortMapEntries = typeof sortMapEntries === "function" ? sortMapEntries : sortMapEntries === true ? sortMapEntriesByKey : null;
	}
	clone() {
		const copy = Object.create(Schema.prototype, Object.getOwnPropertyDescriptors(this));
		copy.tags = this.tags.slice();
		return copy;
	}
};
function stringifyDocument(doc, options) {
	const lines = [];
	let hasDirectives = options.directives === true;
	if (options.directives !== false && doc.directives) {
		const dir = doc.directives.toString(doc);
		if (dir) {
			lines.push(dir);
			hasDirectives = true;
		} else if (doc.directives.docStart) hasDirectives = true;
	}
	if (hasDirectives) lines.push("---");
	const ctx = createStringifyContext(doc, options);
	const { commentString } = ctx.options;
	if (doc.commentBefore) {
		if (lines.length !== 1) lines.unshift("");
		const cs = commentString(doc.commentBefore);
		lines.unshift(indentComment(cs, ""));
	}
	let chompKeep = false;
	let contentComment = null;
	if (doc.contents) {
		if (isNode(doc.contents)) {
			if (doc.contents.spaceBefore && hasDirectives) lines.push("");
			if (doc.contents.commentBefore) {
				const cs = commentString(doc.contents.commentBefore);
				lines.push(indentComment(cs, ""));
			}
			ctx.forceBlockIndent = !!doc.comment;
			contentComment = doc.contents.comment;
		}
		const onChompKeep = contentComment ? void 0 : () => chompKeep = true;
		let body = stringify$2(doc.contents, ctx, () => contentComment = null, onChompKeep);
		if (contentComment) body += lineComment(body, "", commentString(contentComment));
		if ((body[0] === "|" || body[0] === ">") && lines[lines.length - 1] === "---") lines[lines.length - 1] = `--- ${body}`;
		else lines.push(body);
	} else lines.push(stringify$2(doc.contents, ctx));
	if (doc.directives?.docEnd) if (doc.comment) {
		const cs = commentString(doc.comment);
		if (cs.includes("\n")) {
			lines.push("...");
			lines.push(indentComment(cs, ""));
		} else lines.push(`... ${cs}`);
	} else lines.push("...");
	else {
		let dc = doc.comment;
		if (dc && chompKeep) dc = dc.replace(/^\n+/, "");
		if (dc) {
			if ((!chompKeep || contentComment) && lines[lines.length - 1] !== "") lines.push("");
			lines.push(indentComment(commentString(dc), ""));
		}
	}
	return lines.join("\n") + "\n";
}
var Document = class Document {
	constructor(value, replacer, options) {
		this.commentBefore = null;
		this.comment = null;
		this.errors = [];
		this.warnings = [];
		Object.defineProperty(this, NODE_TYPE, { value: DOC });
		let _replacer = null;
		if (typeof replacer === "function" || Array.isArray(replacer)) _replacer = replacer;
		else if (options === void 0 && replacer) {
			options = replacer;
			replacer = void 0;
		}
		const opt = Object.assign({
			intAsBigInt: false,
			keepSourceTokens: false,
			logLevel: "warn",
			prettyErrors: true,
			strict: true,
			stringKeys: false,
			uniqueKeys: true,
			version: "1.2"
		}, options);
		this.options = opt;
		let { version } = opt;
		if (options?._directives) {
			this.directives = options._directives.atDocument();
			if (this.directives.yaml.explicit) version = this.directives.yaml.version;
		} else this.directives = new Directives({ version });
		this.setSchema(version, options);
		this.contents = value === void 0 ? null : this.createNode(value, _replacer, options);
	}
	clone() {
		const copy = Object.create(Document.prototype, { [NODE_TYPE]: { value: DOC } });
		copy.commentBefore = this.commentBefore;
		copy.comment = this.comment;
		copy.errors = this.errors.slice();
		copy.warnings = this.warnings.slice();
		copy.options = Object.assign({}, this.options);
		if (this.directives) copy.directives = this.directives.clone();
		copy.schema = this.schema.clone();
		copy.contents = isNode(this.contents) ? this.contents.clone(copy.schema) : this.contents;
		if (this.range) copy.range = this.range.slice();
		return copy;
	}
	add(value) {
		if (assertCollection(this.contents)) this.contents.add(value);
	}
	addIn(path$1, value) {
		if (assertCollection(this.contents)) this.contents.addIn(path$1, value);
	}
	createAlias(node, name) {
		if (!node.anchor) {
			const prev = anchorNames(this);
			node.anchor = !name || prev.has(name) ? findNewAnchor(name || "a", prev) : name;
		}
		return new Alias(node.anchor);
	}
	createNode(value, replacer, options) {
		let _replacer = void 0;
		if (typeof replacer === "function") {
			value = replacer.call({ "": value }, "", value);
			_replacer = replacer;
		} else if (Array.isArray(replacer)) {
			const keyToStr = (v) => typeof v === "number" || v instanceof String || v instanceof Number;
			const asStr = replacer.filter(keyToStr).map(String);
			if (asStr.length > 0) replacer = replacer.concat(asStr);
			_replacer = replacer;
		} else if (options === void 0 && replacer) {
			options = replacer;
			replacer = void 0;
		}
		const { aliasDuplicateObjects, anchorPrefix, flow, keepUndefined, onTagObj, tag } = options ?? {};
		const { onAnchor, setAnchors, sourceObjects } = createNodeAnchors(this, anchorPrefix || "a");
		const ctx = {
			aliasDuplicateObjects: aliasDuplicateObjects ?? true,
			keepUndefined: keepUndefined ?? false,
			onAnchor,
			onTagObj,
			replacer: _replacer,
			schema: this.schema,
			sourceObjects
		};
		const node = createNode(value, tag, ctx);
		if (flow && isCollection(node)) node.flow = true;
		setAnchors();
		return node;
	}
	createPair(key, value, options = {}) {
		return new Pair(this.createNode(key, null, options), this.createNode(value, null, options));
	}
	delete(key) {
		return assertCollection(this.contents) ? this.contents.delete(key) : false;
	}
	deleteIn(path$1) {
		if (isEmptyPath(path$1)) {
			if (this.contents == null) return false;
			this.contents = null;
			return true;
		}
		return assertCollection(this.contents) ? this.contents.deleteIn(path$1) : false;
	}
	get(key, keepScalar) {
		return isCollection(this.contents) ? this.contents.get(key, keepScalar) : void 0;
	}
	getIn(path$1, keepScalar) {
		if (isEmptyPath(path$1)) return !keepScalar && isScalar(this.contents) ? this.contents.value : this.contents;
		return isCollection(this.contents) ? this.contents.getIn(path$1, keepScalar) : void 0;
	}
	has(key) {
		return isCollection(this.contents) ? this.contents.has(key) : false;
	}
	hasIn(path$1) {
		if (isEmptyPath(path$1)) return this.contents !== void 0;
		return isCollection(this.contents) ? this.contents.hasIn(path$1) : false;
	}
	set(key, value) {
		if (this.contents == null) this.contents = collectionFromPath(this.schema, [key], value);
		else if (assertCollection(this.contents)) this.contents.set(key, value);
	}
	setIn(path$1, value) {
		if (isEmptyPath(path$1)) this.contents = value;
		else if (this.contents == null) this.contents = collectionFromPath(this.schema, Array.from(path$1), value);
		else if (assertCollection(this.contents)) this.contents.setIn(path$1, value);
	}
	setSchema(version, options = {}) {
		if (typeof version === "number") version = String(version);
		let opt;
		switch (version) {
			case "1.1":
				if (this.directives) this.directives.yaml.version = "1.1";
				else this.directives = new Directives({ version: "1.1" });
				opt = {
					resolveKnownTags: false,
					schema: "yaml-1.1"
				};
				break;
			case "1.2":
			case "next":
				if (this.directives) this.directives.yaml.version = version;
				else this.directives = new Directives({ version });
				opt = {
					resolveKnownTags: true,
					schema: "core"
				};
				break;
			case null:
				if (this.directives) delete this.directives;
				opt = null;
				break;
			default: {
				const sv = JSON.stringify(version);
				throw new Error(`Expected '1.1', '1.2' or null as first argument, but found: ${sv}`);
			}
		}
		if (options.schema instanceof Object) this.schema = options.schema;
		else if (opt) this.schema = new Schema(Object.assign(opt, options));
		else throw new Error(`With a null YAML version, the { schema: Schema } option is required`);
	}
	toJS({ json: json$1, jsonArg, mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
		const ctx = {
			anchors: /* @__PURE__ */ new Map(),
			doc: this,
			keep: !json$1,
			mapAsMap: mapAsMap === true,
			mapKeyWarned: false,
			maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
		};
		const res = toJS(this.contents, jsonArg ?? "", ctx);
		if (typeof onAnchor === "function") for (const { count, res: res$1 } of ctx.anchors.values()) onAnchor(res$1, count);
		return typeof reviver === "function" ? applyReviver(reviver, { "": res }, "", res) : res;
	}
	toJSON(jsonArg, onAnchor) {
		return this.toJS({
			json: true,
			jsonArg,
			mapAsMap: false,
			onAnchor
		});
	}
	toString(options = {}) {
		if (this.errors.length > 0) throw new Error("Document with errors cannot be stringified");
		if ("indent" in options && (!Number.isInteger(options.indent) || Number(options.indent) <= 0)) {
			const s = JSON.stringify(options.indent);
			throw new Error(`"indent" option must be a positive integer, not ${s}`);
		}
		return stringifyDocument(this, options);
	}
};
function assertCollection(contents) {
	if (isCollection(contents)) return true;
	throw new Error("Expected a YAML collection as document contents");
}
var YAMLError = class extends Error {
	constructor(name, pos, code, message) {
		super();
		this.name = name;
		this.code = code;
		this.message = message;
		this.pos = pos;
	}
};
var YAMLParseError = class extends YAMLError {
	constructor(pos, code, message) {
		super("YAMLParseError", pos, code, message);
	}
};
var YAMLWarning = class extends YAMLError {
	constructor(pos, code, message) {
		super("YAMLWarning", pos, code, message);
	}
};
var prettifyError = (src, lc) => (error) => {
	if (error.pos[0] === -1) return;
	error.linePos = error.pos.map((pos) => lc.linePos(pos));
	const { line, col } = error.linePos[0];
	error.message += ` at line ${line}, column ${col}`;
	let ci = col - 1;
	let lineStr = src.substring(lc.lineStarts[line - 1], lc.lineStarts[line]).replace(/[\n\r]+$/, "");
	if (ci >= 60 && lineStr.length > 80) {
		const trimStart = Math.min(ci - 39, lineStr.length - 79);
		lineStr = "…" + lineStr.substring(trimStart);
		ci -= trimStart - 1;
	}
	if (lineStr.length > 80) lineStr = lineStr.substring(0, 79) + "…";
	if (line > 1 && /^ *$/.test(lineStr.substring(0, ci))) {
		let prev = src.substring(lc.lineStarts[line - 2], lc.lineStarts[line - 1]);
		if (prev.length > 80) prev = prev.substring(0, 79) + "…\n";
		lineStr = prev + lineStr;
	}
	if (/[^ ]/.test(lineStr)) {
		let count = 1;
		const end = error.linePos[1];
		if (end && end.line === line && end.col > col) count = Math.max(1, Math.min(end.col - col, 80 - ci));
		const pointer = " ".repeat(ci) + "^".repeat(count);
		error.message += `:\n\n${lineStr}\n${pointer}\n`;
	}
};
function resolveProps(tokens, { flow, indicator, next, offset: offset$1, onError, parentIndent, startOnNewline }) {
	let spaceBefore = false;
	let atNewline = startOnNewline;
	let hasSpace = startOnNewline;
	let comment = "";
	let commentSep = "";
	let hasNewline = false;
	let reqSpace = false;
	let tab = null;
	let anchor = null;
	let tag = null;
	let newlineAfterProp = null;
	let comma = null;
	let found = null;
	let start = null;
	for (const token of tokens) {
		if (reqSpace) {
			if (token.type !== "space" && token.type !== "newline" && token.type !== "comma") onError(token.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
			reqSpace = false;
		}
		if (tab) {
			if (atNewline && token.type !== "comment" && token.type !== "newline") onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
			tab = null;
		}
		switch (token.type) {
			case "space":
				if (!flow && (indicator !== "doc-start" || next?.type !== "flow-collection") && token.source.includes("	")) tab = token;
				hasSpace = true;
				break;
			case "comment": {
				if (!hasSpace) onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
				const cb = token.source.substring(1) || " ";
				if (!comment) comment = cb;
				else comment += commentSep + cb;
				commentSep = "";
				atNewline = false;
				break;
			}
			case "newline":
				if (atNewline) {
					if (comment) comment += token.source;
					else if (!found || indicator !== "seq-item-ind") spaceBefore = true;
				} else commentSep += token.source;
				atNewline = true;
				hasNewline = true;
				if (anchor || tag) newlineAfterProp = token;
				hasSpace = true;
				break;
			case "anchor":
				if (anchor) onError(token, "MULTIPLE_ANCHORS", "A node can have at most one anchor");
				if (token.source.endsWith(":")) onError(token.offset + token.source.length - 1, "BAD_ALIAS", "Anchor ending in : is ambiguous", true);
				anchor = token;
				start ?? (start = token.offset);
				atNewline = false;
				hasSpace = false;
				reqSpace = true;
				break;
			case "tag":
				if (tag) onError(token, "MULTIPLE_TAGS", "A node can have at most one tag");
				tag = token;
				start ?? (start = token.offset);
				atNewline = false;
				hasSpace = false;
				reqSpace = true;
				break;
			case indicator:
				if (anchor || tag) onError(token, "BAD_PROP_ORDER", `Anchors and tags must be after the ${token.source} indicator`);
				if (found) onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.source} in ${flow ?? "collection"}`);
				found = token;
				atNewline = indicator === "seq-item-ind" || indicator === "explicit-key-ind";
				hasSpace = false;
				break;
			case "comma": if (flow) {
				if (comma) onError(token, "UNEXPECTED_TOKEN", `Unexpected , in ${flow}`);
				comma = token;
				atNewline = false;
				hasSpace = false;
				break;
			}
			default:
				onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.type} token`);
				atNewline = false;
				hasSpace = false;
		}
	}
	const last$2 = tokens[tokens.length - 1];
	const end = last$2 ? last$2.offset + last$2.source.length : offset$1;
	if (reqSpace && next && next.type !== "space" && next.type !== "newline" && next.type !== "comma" && (next.type !== "scalar" || next.source !== "")) onError(next.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
	if (tab && (atNewline && tab.indent <= parentIndent || next?.type === "block-map" || next?.type === "block-seq")) onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
	return {
		comma,
		found,
		spaceBefore,
		comment,
		hasNewline,
		anchor,
		tag,
		newlineAfterProp,
		end,
		start: start ?? end
	};
}
function containsNewline(key) {
	if (!key) return null;
	switch (key.type) {
		case "alias":
		case "scalar":
		case "double-quoted-scalar":
		case "single-quoted-scalar":
			if (key.source.includes("\n")) return true;
			if (key.end) {
				for (const st of key.end) if (st.type === "newline") return true;
			}
			return false;
		case "flow-collection":
			for (const it of key.items) {
				for (const st of it.start) if (st.type === "newline") return true;
				if (it.sep) {
					for (const st of it.sep) if (st.type === "newline") return true;
				}
				if (containsNewline(it.key) || containsNewline(it.value)) return true;
			}
			return false;
		default: return true;
	}
}
function flowIndentCheck(indent, fc, onError) {
	if (fc?.type === "flow-collection") {
		const end = fc.end[0];
		if (end.indent === indent && (end.source === "]" || end.source === "}") && containsNewline(fc)) onError(end, "BAD_INDENT", "Flow end indicator should be more indented than parent", true);
	}
}
function mapIncludes(ctx, items, search$1) {
	const { uniqueKeys } = ctx.options;
	if (uniqueKeys === false) return false;
	const isEqual = typeof uniqueKeys === "function" ? uniqueKeys : (a, b) => a === b || isScalar(a) && isScalar(b) && a.value === b.value;
	return items.some((pair) => isEqual(pair.key, search$1));
}
var startColMsg = "All mapping items must start at the same column";
function resolveBlockMap({ composeNode: composeNode$1, composeEmptyNode: composeEmptyNode$1 }, ctx, bm, onError, tag) {
	const map$2 = new (tag?.nodeClass ?? YAMLMap)(ctx.schema);
	if (ctx.atRoot) ctx.atRoot = false;
	let offset$1 = bm.offset;
	let commentEnd = null;
	for (const collItem of bm.items) {
		const { start, key, sep: sep$1, value } = collItem;
		const keyProps = resolveProps(start, {
			indicator: "explicit-key-ind",
			next: key ?? sep$1?.[0],
			offset: offset$1,
			onError,
			parentIndent: bm.indent,
			startOnNewline: true
		});
		const implicitKey = !keyProps.found;
		if (implicitKey) {
			if (key) {
				if (key.type === "block-seq") onError(offset$1, "BLOCK_AS_IMPLICIT_KEY", "A block sequence may not be used as an implicit map key");
				else if ("indent" in key && key.indent !== bm.indent) onError(offset$1, "BAD_INDENT", startColMsg);
			}
			if (!keyProps.anchor && !keyProps.tag && !sep$1) {
				commentEnd = keyProps.end;
				if (keyProps.comment) if (map$2.comment) map$2.comment += "\n" + keyProps.comment;
				else map$2.comment = keyProps.comment;
				continue;
			}
			if (keyProps.newlineAfterProp || containsNewline(key)) onError(key ?? start[start.length - 1], "MULTILINE_IMPLICIT_KEY", "Implicit keys need to be on a single line");
		} else if (keyProps.found?.indent !== bm.indent) onError(offset$1, "BAD_INDENT", startColMsg);
		ctx.atKey = true;
		const keyStart = keyProps.end;
		const keyNode = key ? composeNode$1(ctx, key, keyProps, onError) : composeEmptyNode$1(ctx, keyStart, start, null, keyProps, onError);
		if (ctx.schema.compat) flowIndentCheck(bm.indent, key, onError);
		ctx.atKey = false;
		if (mapIncludes(ctx, map$2.items, keyNode)) onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
		const valueProps = resolveProps(sep$1 ?? [], {
			indicator: "map-value-ind",
			next: value,
			offset: keyNode.range[2],
			onError,
			parentIndent: bm.indent,
			startOnNewline: !key || key.type === "block-scalar"
		});
		offset$1 = valueProps.end;
		if (valueProps.found) {
			if (implicitKey) {
				if (value?.type === "block-map" && !valueProps.hasNewline) onError(offset$1, "BLOCK_AS_IMPLICIT_KEY", "Nested mappings are not allowed in compact mappings");
				if (ctx.options.strict && keyProps.start < valueProps.found.offset - 1024) onError(keyNode.range, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit block mapping key");
			}
			const valueNode = value ? composeNode$1(ctx, value, valueProps, onError) : composeEmptyNode$1(ctx, offset$1, sep$1, null, valueProps, onError);
			if (ctx.schema.compat) flowIndentCheck(bm.indent, value, onError);
			offset$1 = valueNode.range[2];
			const pair = new Pair(keyNode, valueNode);
			if (ctx.options.keepSourceTokens) pair.srcToken = collItem;
			map$2.items.push(pair);
		} else {
			if (implicitKey) onError(keyNode.range, "MISSING_CHAR", "Implicit map keys need to be followed by map values");
			if (valueProps.comment) if (keyNode.comment) keyNode.comment += "\n" + valueProps.comment;
			else keyNode.comment = valueProps.comment;
			const pair = new Pair(keyNode);
			if (ctx.options.keepSourceTokens) pair.srcToken = collItem;
			map$2.items.push(pair);
		}
	}
	if (commentEnd && commentEnd < offset$1) onError(commentEnd, "IMPOSSIBLE", "Map comment with trailing content");
	map$2.range = [
		bm.offset,
		offset$1,
		commentEnd ?? offset$1
	];
	return map$2;
}
function resolveBlockSeq({ composeNode: composeNode$1, composeEmptyNode: composeEmptyNode$1 }, ctx, bs, onError, tag) {
	const seq$1 = new (tag?.nodeClass ?? YAMLSeq)(ctx.schema);
	if (ctx.atRoot) ctx.atRoot = false;
	if (ctx.atKey) ctx.atKey = false;
	let offset$1 = bs.offset;
	let commentEnd = null;
	for (const { start, value } of bs.items) {
		const props = resolveProps(start, {
			indicator: "seq-item-ind",
			next: value,
			offset: offset$1,
			onError,
			parentIndent: bs.indent,
			startOnNewline: true
		});
		if (!props.found) if (props.anchor || props.tag || value) if (value && value.type === "block-seq") onError(props.end, "BAD_INDENT", "All sequence items must start at the same column");
		else onError(offset$1, "MISSING_CHAR", "Sequence item without - indicator");
		else {
			commentEnd = props.end;
			if (props.comment) seq$1.comment = props.comment;
			continue;
		}
		const node = value ? composeNode$1(ctx, value, props, onError) : composeEmptyNode$1(ctx, props.end, start, null, props, onError);
		if (ctx.schema.compat) flowIndentCheck(bs.indent, value, onError);
		offset$1 = node.range[2];
		seq$1.items.push(node);
	}
	seq$1.range = [
		bs.offset,
		offset$1,
		commentEnd ?? offset$1
	];
	return seq$1;
}
function resolveEnd(end, offset$1, reqSpace, onError) {
	let comment = "";
	if (end) {
		let hasSpace = false;
		let sep$1 = "";
		for (const token of end) {
			const { source, type } = token;
			switch (type) {
				case "space":
					hasSpace = true;
					break;
				case "comment": {
					if (reqSpace && !hasSpace) onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
					const cb = source.substring(1) || " ";
					if (!comment) comment = cb;
					else comment += sep$1 + cb;
					sep$1 = "";
					break;
				}
				case "newline":
					if (comment) sep$1 += source;
					hasSpace = true;
					break;
				default: onError(token, "UNEXPECTED_TOKEN", `Unexpected ${type} at node end`);
			}
			offset$1 += source.length;
		}
	}
	return {
		comment,
		offset: offset$1
	};
}
var blockMsg = "Block collections are not allowed within flow collections";
var isBlock = (token) => token && (token.type === "block-map" || token.type === "block-seq");
function resolveFlowCollection({ composeNode: composeNode$1, composeEmptyNode: composeEmptyNode$1 }, ctx, fc, onError, tag) {
	const isMap$1 = fc.start.source === "{";
	const fcName = isMap$1 ? "flow map" : "flow sequence";
	const coll = new (tag?.nodeClass ?? (isMap$1 ? YAMLMap : YAMLSeq))(ctx.schema);
	coll.flow = true;
	const atRoot = ctx.atRoot;
	if (atRoot) ctx.atRoot = false;
	if (ctx.atKey) ctx.atKey = false;
	let offset$1 = fc.offset + fc.start.source.length;
	for (let i = 0; i < fc.items.length; ++i) {
		const collItem = fc.items[i];
		const { start, key, sep: sep$1, value } = collItem;
		const props = resolveProps(start, {
			flow: fcName,
			indicator: "explicit-key-ind",
			next: key ?? sep$1?.[0],
			offset: offset$1,
			onError,
			parentIndent: fc.indent,
			startOnNewline: false
		});
		if (!props.found) {
			if (!props.anchor && !props.tag && !sep$1 && !value) {
				if (i === 0 && props.comma) onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
				else if (i < fc.items.length - 1) onError(props.start, "UNEXPECTED_TOKEN", `Unexpected empty item in ${fcName}`);
				if (props.comment) if (coll.comment) coll.comment += "\n" + props.comment;
				else coll.comment = props.comment;
				offset$1 = props.end;
				continue;
			}
			if (!isMap$1 && ctx.options.strict && containsNewline(key)) onError(key, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
		}
		if (i === 0) {
			if (props.comma) onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
		} else {
			if (!props.comma) onError(props.start, "MISSING_CHAR", `Missing , between ${fcName} items`);
			if (props.comment) {
				let prevItemComment = "";
				loop: for (const st of start) switch (st.type) {
					case "comma":
					case "space": break;
					case "comment":
						prevItemComment = st.source.substring(1);
						break loop;
					default: break loop;
				}
				if (prevItemComment) {
					let prev = coll.items[coll.items.length - 1];
					if (isPair(prev)) prev = prev.value ?? prev.key;
					if (prev.comment) prev.comment += "\n" + prevItemComment;
					else prev.comment = prevItemComment;
					props.comment = props.comment.substring(prevItemComment.length + 1);
				}
			}
		}
		if (!isMap$1 && !sep$1 && !props.found) {
			const valueNode = value ? composeNode$1(ctx, value, props, onError) : composeEmptyNode$1(ctx, props.end, sep$1, null, props, onError);
			coll.items.push(valueNode);
			offset$1 = valueNode.range[2];
			if (isBlock(value)) onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
		} else {
			ctx.atKey = true;
			const keyStart = props.end;
			const keyNode = key ? composeNode$1(ctx, key, props, onError) : composeEmptyNode$1(ctx, keyStart, start, null, props, onError);
			if (isBlock(key)) onError(keyNode.range, "BLOCK_IN_FLOW", blockMsg);
			ctx.atKey = false;
			const valueProps = resolveProps(sep$1 ?? [], {
				flow: fcName,
				indicator: "map-value-ind",
				next: value,
				offset: keyNode.range[2],
				onError,
				parentIndent: fc.indent,
				startOnNewline: false
			});
			if (valueProps.found) {
				if (!isMap$1 && !props.found && ctx.options.strict) {
					if (sep$1) for (const st of sep$1) {
						if (st === valueProps.found) break;
						if (st.type === "newline") {
							onError(st, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
							break;
						}
					}
					if (props.start < valueProps.found.offset - 1024) onError(valueProps.found, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit flow sequence key");
				}
			} else if (value) if ("source" in value && value.source && value.source[0] === ":") onError(value, "MISSING_CHAR", `Missing space after : in ${fcName}`);
			else onError(valueProps.start, "MISSING_CHAR", `Missing , or : between ${fcName} items`);
			const valueNode = value ? composeNode$1(ctx, value, valueProps, onError) : valueProps.found ? composeEmptyNode$1(ctx, valueProps.end, sep$1, null, valueProps, onError) : null;
			if (valueNode) {
				if (isBlock(value)) onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
			} else if (valueProps.comment) if (keyNode.comment) keyNode.comment += "\n" + valueProps.comment;
			else keyNode.comment = valueProps.comment;
			const pair = new Pair(keyNode, valueNode);
			if (ctx.options.keepSourceTokens) pair.srcToken = collItem;
			if (isMap$1) {
				const map$2 = coll;
				if (mapIncludes(ctx, map$2.items, keyNode)) onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
				map$2.items.push(pair);
			} else {
				const map$2 = new YAMLMap(ctx.schema);
				map$2.flow = true;
				map$2.items.push(pair);
				const endRange = (valueNode ?? keyNode).range;
				map$2.range = [
					keyNode.range[0],
					endRange[1],
					endRange[2]
				];
				coll.items.push(map$2);
			}
			offset$1 = valueNode ? valueNode.range[2] : valueProps.end;
		}
	}
	const expectedEnd = isMap$1 ? "}" : "]";
	const [ce, ...ee] = fc.end;
	let cePos = offset$1;
	if (ce && ce.source === expectedEnd) cePos = ce.offset + ce.source.length;
	else {
		const name = fcName[0].toUpperCase() + fcName.substring(1);
		const msg = atRoot ? `${name} must end with a ${expectedEnd}` : `${name} in block collection must be sufficiently indented and end with a ${expectedEnd}`;
		onError(offset$1, atRoot ? "MISSING_CHAR" : "BAD_INDENT", msg);
		if (ce && ce.source.length !== 1) ee.unshift(ce);
	}
	if (ee.length > 0) {
		const end = resolveEnd(ee, cePos, ctx.options.strict, onError);
		if (end.comment) if (coll.comment) coll.comment += "\n" + end.comment;
		else coll.comment = end.comment;
		coll.range = [
			fc.offset,
			cePos,
			end.offset
		];
	} else coll.range = [
		fc.offset,
		cePos,
		cePos
	];
	return coll;
}
function resolveCollection(CN$1, ctx, token, onError, tagName, tag) {
	const coll = token.type === "block-map" ? resolveBlockMap(CN$1, ctx, token, onError, tag) : token.type === "block-seq" ? resolveBlockSeq(CN$1, ctx, token, onError, tag) : resolveFlowCollection(CN$1, ctx, token, onError, tag);
	const Coll = coll.constructor;
	if (tagName === "!" || tagName === Coll.tagName) {
		coll.tag = Coll.tagName;
		return coll;
	}
	if (tagName) coll.tag = tagName;
	return coll;
}
function composeCollection(CN$1, ctx, token, props, onError) {
	const tagToken = props.tag;
	const tagName = !tagToken ? null : ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg));
	if (token.type === "block-seq") {
		const { anchor, newlineAfterProp: nl } = props;
		const lastProp = anchor && tagToken ? anchor.offset > tagToken.offset ? anchor : tagToken : anchor ?? tagToken;
		if (lastProp && (!nl || nl.offset < lastProp.offset)) onError(lastProp, "MISSING_CHAR", "Missing newline after block sequence props");
	}
	const expType = token.type === "block-map" ? "map" : token.type === "block-seq" ? "seq" : token.start.source === "{" ? "map" : "seq";
	if (!tagToken || !tagName || tagName === "!" || tagName === YAMLMap.tagName && expType === "map" || tagName === YAMLSeq.tagName && expType === "seq") return resolveCollection(CN$1, ctx, token, onError, tagName);
	let tag = ctx.schema.tags.find((t) => t.tag === tagName && t.collection === expType);
	if (!tag) {
		const kt = ctx.schema.knownTags[tagName];
		if (kt && kt.collection === expType) {
			ctx.schema.tags.push(Object.assign({}, kt, { default: false }));
			tag = kt;
		} else {
			if (kt) onError(tagToken, "BAD_COLLECTION_TYPE", `${kt.tag} used for ${expType} collection, but expects ${kt.collection ?? "scalar"}`, true);
			else onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, true);
			return resolveCollection(CN$1, ctx, token, onError, tagName);
		}
	}
	const coll = resolveCollection(CN$1, ctx, token, onError, tagName, tag);
	const res = tag.resolve?.(coll, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg), ctx.options) ?? coll;
	const node = isNode(res) ? res : new Scalar(res);
	node.range = coll.range;
	node.tag = tagName;
	if (tag?.format) node.format = tag.format;
	return node;
}
function resolveBlockScalar(ctx, scalar, onError) {
	const start = scalar.offset;
	const header = parseBlockScalarHeader(scalar, ctx.options.strict, onError);
	if (!header) return {
		value: "",
		type: null,
		comment: "",
		range: [
			start,
			start,
			start
		]
	};
	const type = header.mode === ">" ? Scalar.BLOCK_FOLDED : Scalar.BLOCK_LITERAL;
	const lines = scalar.source ? splitLines(scalar.source) : [];
	let chompStart = lines.length;
	for (let i = lines.length - 1; i >= 0; --i) {
		const content = lines[i][1];
		if (content === "" || content === "\r") chompStart = i;
		else break;
	}
	if (chompStart === 0) {
		const value$1 = header.chomp === "+" && lines.length > 0 ? "\n".repeat(Math.max(1, lines.length - 1)) : "";
		let end$1 = start + header.length;
		if (scalar.source) end$1 += scalar.source.length;
		return {
			value: value$1,
			type,
			comment: header.comment,
			range: [
				start,
				end$1,
				end$1
			]
		};
	}
	let trimIndent = scalar.indent + header.indent;
	let offset$1 = scalar.offset + header.length;
	let contentStart = 0;
	for (let i = 0; i < chompStart; ++i) {
		const [indent, content] = lines[i];
		if (content === "" || content === "\r") {
			if (header.indent === 0 && indent.length > trimIndent) trimIndent = indent.length;
		} else {
			if (indent.length < trimIndent) onError(offset$1 + indent.length, "MISSING_CHAR", "Block scalars with more-indented leading empty lines must use an explicit indentation indicator");
			if (header.indent === 0) trimIndent = indent.length;
			contentStart = i;
			if (trimIndent === 0 && !ctx.atRoot) onError(offset$1, "BAD_INDENT", "Block scalar values in collections must be indented");
			break;
		}
		offset$1 += indent.length + content.length + 1;
	}
	for (let i = lines.length - 1; i >= chompStart; --i) if (lines[i][0].length > trimIndent) chompStart = i + 1;
	let value = "";
	let sep$1 = "";
	let prevMoreIndented = false;
	for (let i = 0; i < contentStart; ++i) value += lines[i][0].slice(trimIndent) + "\n";
	for (let i = contentStart; i < chompStart; ++i) {
		let [indent, content] = lines[i];
		offset$1 += indent.length + content.length + 1;
		const crlf = content[content.length - 1] === "\r";
		if (crlf) content = content.slice(0, -1);
		/* istanbul ignore if already caught in lexer */
		if (content && indent.length < trimIndent) {
			const message = `Block scalar lines must not be less indented than their ${header.indent ? "explicit indentation indicator" : "first line"}`;
			onError(offset$1 - content.length - (crlf ? 2 : 1), "BAD_INDENT", message);
			indent = "";
		}
		if (type === Scalar.BLOCK_LITERAL) {
			value += sep$1 + indent.slice(trimIndent) + content;
			sep$1 = "\n";
		} else if (indent.length > trimIndent || content[0] === "	") {
			if (sep$1 === " ") sep$1 = "\n";
			else if (!prevMoreIndented && sep$1 === "\n") sep$1 = "\n\n";
			value += sep$1 + indent.slice(trimIndent) + content;
			sep$1 = "\n";
			prevMoreIndented = true;
		} else if (content === "") if (sep$1 === "\n") value += "\n";
		else sep$1 = "\n";
		else {
			value += sep$1 + content;
			sep$1 = " ";
			prevMoreIndented = false;
		}
	}
	switch (header.chomp) {
		case "-": break;
		case "+":
			for (let i = chompStart; i < lines.length; ++i) value += "\n" + lines[i][0].slice(trimIndent);
			if (value[value.length - 1] !== "\n") value += "\n";
			break;
		default: value += "\n";
	}
	const end = start + header.length + scalar.source.length;
	return {
		value,
		type,
		comment: header.comment,
		range: [
			start,
			end,
			end
		]
	};
}
function parseBlockScalarHeader({ offset: offset$1, props }, strict, onError) {
	/* istanbul ignore if should not happen */
	if (props[0].type !== "block-scalar-header") {
		onError(props[0], "IMPOSSIBLE", "Block scalar header not found");
		return null;
	}
	const { source } = props[0];
	const mode = source[0];
	let indent = 0;
	let chomp = "";
	let error = -1;
	for (let i = 1; i < source.length; ++i) {
		const ch = source[i];
		if (!chomp && (ch === "-" || ch === "+")) chomp = ch;
		else {
			const n = Number(ch);
			if (!indent && n) indent = n;
			else if (error === -1) error = offset$1 + i;
		}
	}
	if (error !== -1) onError(error, "UNEXPECTED_TOKEN", `Block scalar header includes extra characters: ${source}`);
	let hasSpace = false;
	let comment = "";
	let length = source.length;
	for (let i = 1; i < props.length; ++i) {
		const token = props[i];
		switch (token.type) {
			case "space": hasSpace = true;
			case "newline":
				length += token.source.length;
				break;
			case "comment":
				if (strict && !hasSpace) onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
				length += token.source.length;
				comment = token.source.substring(1);
				break;
			case "error":
				onError(token, "UNEXPECTED_TOKEN", token.message);
				length += token.source.length;
				break;
			default: {
				onError(token, "UNEXPECTED_TOKEN", `Unexpected token in block scalar header: ${token.type}`);
				const ts = token.source;
				if (ts && typeof ts === "string") length += ts.length;
			}
		}
	}
	return {
		mode,
		indent,
		chomp,
		comment,
		length
	};
}
function splitLines(source) {
	const split$1 = source.split(/\n( *)/);
	const first$1 = split$1[0];
	const m = first$1.match(/^( *)/);
	const lines = [m?.[1] ? [m[1], first$1.slice(m[1].length)] : ["", first$1]];
	for (let i = 1; i < split$1.length; i += 2) lines.push([split$1[i], split$1[i + 1]]);
	return lines;
}
function resolveFlowScalar(scalar, strict, onError) {
	const { offset: offset$1, type, source, end } = scalar;
	let _type;
	let value;
	const _onError = (rel, code, msg) => onError(offset$1 + rel, code, msg);
	switch (type) {
		case "scalar":
			_type = Scalar.PLAIN;
			value = plainValue(source, _onError);
			break;
		case "single-quoted-scalar":
			_type = Scalar.QUOTE_SINGLE;
			value = singleQuotedValue(source, _onError);
			break;
		case "double-quoted-scalar":
			_type = Scalar.QUOTE_DOUBLE;
			value = doubleQuotedValue(source, _onError);
			break;
		default:
			onError(scalar, "UNEXPECTED_TOKEN", `Expected a flow scalar value, but found: ${type}`);
			return {
				value: "",
				type: null,
				comment: "",
				range: [
					offset$1,
					offset$1 + source.length,
					offset$1 + source.length
				]
			};
	}
	const valueEnd = offset$1 + source.length;
	const re = resolveEnd(end, valueEnd, strict, onError);
	return {
		value,
		type: _type,
		comment: re.comment,
		range: [
			offset$1,
			valueEnd,
			re.offset
		]
	};
}
function plainValue(source, onError) {
	let badChar = "";
	switch (source[0]) {
		case "	":
			badChar = "a tab character";
			break;
		case ",":
			badChar = "flow indicator character ,";
			break;
		case "%":
			badChar = "directive indicator character %";
			break;
		case "|":
		case ">":
			badChar = `block scalar indicator ${source[0]}`;
			break;
		case "@":
		case "`":
			badChar = `reserved character ${source[0]}`;
			break;
	}
	if (badChar) onError(0, "BAD_SCALAR_START", `Plain value cannot start with ${badChar}`);
	return foldLines(source);
}
function singleQuotedValue(source, onError) {
	if (source[source.length - 1] !== "'" || source.length === 1) onError(source.length, "MISSING_CHAR", "Missing closing 'quote");
	return foldLines(source.slice(1, -1)).replace(/''/g, "'");
}
function foldLines(source) {
	let first$1, line;
	try {
		first$1 = new RegExp("(.*?)(?<![ 	])[ 	]*\r?\n", "sy");
		line = new RegExp("[ 	]*(.*?)(?:(?<![ 	])[ 	]*)?\r?\n", "sy");
	} catch {
		first$1 = /(.*?)[ \t]*\r?\n/sy;
		line = /[ \t]*(.*?)[ \t]*\r?\n/sy;
	}
	let match = first$1.exec(source);
	if (!match) return source;
	let res = match[1];
	let sep$1 = " ";
	let pos = first$1.lastIndex;
	line.lastIndex = pos;
	while (match = line.exec(source)) {
		if (match[1] === "") if (sep$1 === "\n") res += sep$1;
		else sep$1 = "\n";
		else {
			res += sep$1 + match[1];
			sep$1 = " ";
		}
		pos = line.lastIndex;
	}
	const last$2 = /[ \t]*(.*)/sy;
	last$2.lastIndex = pos;
	match = last$2.exec(source);
	return res + sep$1 + (match?.[1] ?? "");
}
function doubleQuotedValue(source, onError) {
	let res = "";
	for (let i = 1; i < source.length - 1; ++i) {
		const ch = source[i];
		if (ch === "\r" && source[i + 1] === "\n") continue;
		if (ch === "\n") {
			const { fold, offset: offset$1 } = foldNewline(source, i);
			res += fold;
			i = offset$1;
		} else if (ch === "\\") {
			let next = source[++i];
			const cc = escapeCodes[next];
			if (cc) res += cc;
			else if (next === "\n") {
				next = source[i + 1];
				while (next === " " || next === "	") next = source[++i + 1];
			} else if (next === "\r" && source[i + 1] === "\n") {
				next = source[++i + 1];
				while (next === " " || next === "	") next = source[++i + 1];
			} else if (next === "x" || next === "u" || next === "U") {
				const length = {
					x: 2,
					u: 4,
					U: 8
				}[next];
				res += parseCharCode(source, i + 1, length, onError);
				i += length;
			} else {
				const raw = source.substr(i - 1, 2);
				onError(i - 1, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
				res += raw;
			}
		} else if (ch === " " || ch === "	") {
			const wsStart = i;
			let next = source[i + 1];
			while (next === " " || next === "	") next = source[++i + 1];
			if (next !== "\n" && !(next === "\r" && source[i + 2] === "\n")) res += i > wsStart ? source.slice(wsStart, i + 1) : ch;
		} else res += ch;
	}
	if (source[source.length - 1] !== "\"" || source.length === 1) onError(source.length, "MISSING_CHAR", "Missing closing \"quote");
	return res;
}
function foldNewline(source, offset$1) {
	let fold = "";
	let ch = source[offset$1 + 1];
	while (ch === " " || ch === "	" || ch === "\n" || ch === "\r") {
		if (ch === "\r" && source[offset$1 + 2] !== "\n") break;
		if (ch === "\n") fold += "\n";
		offset$1 += 1;
		ch = source[offset$1 + 1];
	}
	if (!fold) fold = " ";
	return {
		fold,
		offset: offset$1
	};
}
var escapeCodes = {
	"0": "\0",
	a: "\x07",
	b: "\b",
	e: "\x1B",
	f: "\f",
	n: "\n",
	r: "\r",
	t: "	",
	v: "\v",
	N: "",
	_: "\xA0",
	L: "\u2028",
	P: "\u2029",
	" ": " ",
	"\"": "\"",
	"/": "/",
	"\\": "\\",
	"	": "	"
};
function parseCharCode(source, offset$1, length, onError) {
	const cc = source.substr(offset$1, length);
	const code = cc.length === length && /^[0-9a-fA-F]+$/.test(cc) ? parseInt(cc, 16) : NaN;
	if (isNaN(code)) {
		const raw = source.substr(offset$1 - 2, length + 2);
		onError(offset$1 - 2, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
		return raw;
	}
	return String.fromCodePoint(code);
}
function composeScalar(ctx, token, tagToken, onError) {
	const { value, type, comment, range: range$1 } = token.type === "block-scalar" ? resolveBlockScalar(ctx, token, onError) : resolveFlowScalar(token, ctx.options.strict, onError);
	const tagName = tagToken ? ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg)) : null;
	let tag;
	if (ctx.options.stringKeys && ctx.atKey) tag = ctx.schema[SCALAR$1];
	else if (tagName) tag = findScalarTagByName(ctx.schema, value, tagName, tagToken, onError);
	else if (token.type === "scalar") tag = findScalarTagByTest(ctx, value, token, onError);
	else tag = ctx.schema[SCALAR$1];
	let scalar;
	try {
		const res = tag.resolve(value, (msg) => onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg), ctx.options);
		scalar = isScalar(res) ? res : new Scalar(res);
	} catch (error) {
		const msg = error instanceof Error ? error.message : String(error);
		onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg);
		scalar = new Scalar(value);
	}
	scalar.range = range$1;
	scalar.source = value;
	if (type) scalar.type = type;
	if (tagName) scalar.tag = tagName;
	if (tag.format) scalar.format = tag.format;
	if (comment) scalar.comment = comment;
	return scalar;
}
function findScalarTagByName(schema$3, value, tagName, tagToken, onError) {
	if (tagName === "!") return schema$3[SCALAR$1];
	const matchWithTest = [];
	for (const tag of schema$3.tags) if (!tag.collection && tag.tag === tagName) if (tag.default && tag.test) matchWithTest.push(tag);
	else return tag;
	for (const tag of matchWithTest) if (tag.test?.test(value)) return tag;
	const kt = schema$3.knownTags[tagName];
	if (kt && !kt.collection) {
		schema$3.tags.push(Object.assign({}, kt, {
			default: false,
			test: void 0
		}));
		return kt;
	}
	onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, tagName !== "tag:yaml.org,2002:str");
	return schema$3[SCALAR$1];
}
function findScalarTagByTest({ atKey, directives, schema: schema$3 }, value, token, onError) {
	const tag = schema$3.tags.find((tag$1) => (tag$1.default === true || atKey && tag$1.default === "key") && tag$1.test?.test(value)) || schema$3[SCALAR$1];
	if (schema$3.compat) {
		const compat = schema$3.compat.find((tag$1) => tag$1.default && tag$1.test?.test(value)) ?? schema$3[SCALAR$1];
		if (tag.tag !== compat.tag) onError(token, "TAG_RESOLVE_FAILED", `Value may be parsed as either ${directives.tagString(tag.tag)} or ${directives.tagString(compat.tag)}`, true);
	}
	return tag;
}
function emptyScalarPosition(offset$1, before, pos) {
	if (before) {
		pos ?? (pos = before.length);
		for (let i = pos - 1; i >= 0; --i) {
			let st = before[i];
			switch (st.type) {
				case "space":
				case "comment":
				case "newline":
					offset$1 -= st.source.length;
					continue;
			}
			st = before[++i];
			while (st?.type === "space") {
				offset$1 += st.source.length;
				st = before[++i];
			}
			break;
		}
	}
	return offset$1;
}
var CN = {
	composeNode,
	composeEmptyNode
};
function composeNode(ctx, token, props, onError) {
	const atKey = ctx.atKey;
	const { spaceBefore, comment, anchor, tag } = props;
	let node;
	let isSrcToken = true;
	switch (token.type) {
		case "alias":
			node = composeAlias(ctx, token, onError);
			if (anchor || tag) onError(token, "ALIAS_PROPS", "An alias node must not specify any properties");
			break;
		case "scalar":
		case "single-quoted-scalar":
		case "double-quoted-scalar":
		case "block-scalar":
			node = composeScalar(ctx, token, tag, onError);
			if (anchor) node.anchor = anchor.source.substring(1);
			break;
		case "block-map":
		case "block-seq":
		case "flow-collection":
			node = composeCollection(CN, ctx, token, props, onError);
			if (anchor) node.anchor = anchor.source.substring(1);
			break;
		default:
			onError(token, "UNEXPECTED_TOKEN", token.type === "error" ? token.message : `Unsupported token (type: ${token.type})`);
			node = composeEmptyNode(ctx, token.offset, void 0, null, props, onError);
			isSrcToken = false;
	}
	if (anchor && node.anchor === "") onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
	if (atKey && ctx.options.stringKeys && (!isScalar(node) || typeof node.value !== "string" || node.tag && node.tag !== "tag:yaml.org,2002:str")) onError(tag ?? token, "NON_STRING_KEY", "With stringKeys, all keys must be strings");
	if (spaceBefore) node.spaceBefore = true;
	if (comment) if (token.type === "scalar" && token.source === "") node.comment = comment;
	else node.commentBefore = comment;
	if (ctx.options.keepSourceTokens && isSrcToken) node.srcToken = token;
	return node;
}
function composeEmptyNode(ctx, offset$1, before, pos, { spaceBefore, comment, anchor, tag, end }, onError) {
	const node = composeScalar(ctx, {
		type: "scalar",
		offset: emptyScalarPosition(offset$1, before, pos),
		indent: -1,
		source: ""
	}, tag, onError);
	if (anchor) {
		node.anchor = anchor.source.substring(1);
		if (node.anchor === "") onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
	}
	if (spaceBefore) node.spaceBefore = true;
	if (comment) {
		node.comment = comment;
		node.range[2] = end;
	}
	return node;
}
function composeAlias({ options }, { offset: offset$1, source, end }, onError) {
	const alias = new Alias(source.substring(1));
	if (alias.source === "") onError(offset$1, "BAD_ALIAS", "Alias cannot be an empty string");
	if (alias.source.endsWith(":")) onError(offset$1 + source.length - 1, "BAD_ALIAS", "Alias ending in : is ambiguous", true);
	const valueEnd = offset$1 + source.length;
	const re = resolveEnd(end, valueEnd, options.strict, onError);
	alias.range = [
		offset$1,
		valueEnd,
		re.offset
	];
	if (re.comment) alias.comment = re.comment;
	return alias;
}
function composeDoc(options, directives, { offset: offset$1, start, value, end }, onError) {
	const doc = new Document(void 0, Object.assign({ _directives: directives }, options));
	const ctx = {
		atKey: false,
		atRoot: true,
		directives: doc.directives,
		options: doc.options,
		schema: doc.schema
	};
	const props = resolveProps(start, {
		indicator: "doc-start",
		next: value ?? end?.[0],
		offset: offset$1,
		onError,
		parentIndent: 0,
		startOnNewline: true
	});
	if (props.found) {
		doc.directives.docStart = true;
		if (value && (value.type === "block-map" || value.type === "block-seq") && !props.hasNewline) onError(props.end, "MISSING_CHAR", "Block collection cannot start on same line with directives-end marker");
	}
	doc.contents = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, start, null, props, onError);
	const contentEnd = doc.contents.range[2];
	const re = resolveEnd(end, contentEnd, false, onError);
	if (re.comment) doc.comment = re.comment;
	doc.range = [
		offset$1,
		contentEnd,
		re.offset
	];
	return doc;
}
function getErrorPos(src) {
	if (typeof src === "number") return [src, src + 1];
	if (Array.isArray(src)) return src.length === 2 ? src : [src[0], src[1]];
	const { offset: offset$1, source } = src;
	return [offset$1, offset$1 + (typeof source === "string" ? source.length : 1)];
}
function parsePrelude(prelude) {
	let comment = "";
	let atComment = false;
	let afterEmptyLine = false;
	for (let i = 0; i < prelude.length; ++i) {
		const source = prelude[i];
		switch (source[0]) {
			case "#":
				comment += (comment === "" ? "" : afterEmptyLine ? "\n\n" : "\n") + (source.substring(1) || " ");
				atComment = true;
				afterEmptyLine = false;
				break;
			case "%":
				if (prelude[i + 1]?.[0] !== "#") i += 1;
				atComment = false;
				break;
			default:
				if (!atComment) afterEmptyLine = true;
				atComment = false;
		}
	}
	return {
		comment,
		afterEmptyLine
	};
}
var Composer = class {
	constructor(options = {}) {
		this.doc = null;
		this.atDirectives = false;
		this.prelude = [];
		this.errors = [];
		this.warnings = [];
		this.onError = (source, code, message, warning) => {
			const pos = getErrorPos(source);
			if (warning) this.warnings.push(new YAMLWarning(pos, code, message));
			else this.errors.push(new YAMLParseError(pos, code, message));
		};
		this.directives = new Directives({ version: options.version || "1.2" });
		this.options = options;
	}
	decorate(doc, afterDoc) {
		const { comment, afterEmptyLine } = parsePrelude(this.prelude);
		if (comment) {
			const dc = doc.contents;
			if (afterDoc) doc.comment = doc.comment ? `${doc.comment}\n${comment}` : comment;
			else if (afterEmptyLine || doc.directives.docStart || !dc) doc.commentBefore = comment;
			else if (isCollection(dc) && !dc.flow && dc.items.length > 0) {
				let it = dc.items[0];
				if (isPair(it)) it = it.key;
				const cb = it.commentBefore;
				it.commentBefore = cb ? `${comment}\n${cb}` : comment;
			} else {
				const cb = dc.commentBefore;
				dc.commentBefore = cb ? `${comment}\n${cb}` : comment;
			}
		}
		if (afterDoc) {
			Array.prototype.push.apply(doc.errors, this.errors);
			Array.prototype.push.apply(doc.warnings, this.warnings);
		} else {
			doc.errors = this.errors;
			doc.warnings = this.warnings;
		}
		this.prelude = [];
		this.errors = [];
		this.warnings = [];
	}
	streamInfo() {
		return {
			comment: parsePrelude(this.prelude).comment,
			directives: this.directives,
			errors: this.errors,
			warnings: this.warnings
		};
	}
	*compose(tokens, forceDoc = false, endOffset = -1) {
		for (const token of tokens) yield* this.next(token);
		yield* this.end(forceDoc, endOffset);
	}
	*next(token) {
		switch (token.type) {
			case "directive":
				this.directives.add(token.source, (offset$1, message, warning) => {
					const pos = getErrorPos(token);
					pos[0] += offset$1;
					this.onError(pos, "BAD_DIRECTIVE", message, warning);
				});
				this.prelude.push(token.source);
				this.atDirectives = true;
				break;
			case "document": {
				const doc = composeDoc(this.options, this.directives, token, this.onError);
				if (this.atDirectives && !doc.directives.docStart) this.onError(token, "MISSING_CHAR", "Missing directives-end/doc-start indicator line");
				this.decorate(doc, false);
				if (this.doc) yield this.doc;
				this.doc = doc;
				this.atDirectives = false;
				break;
			}
			case "byte-order-mark":
			case "space": break;
			case "comment":
			case "newline":
				this.prelude.push(token.source);
				break;
			case "error": {
				const msg = token.source ? `${token.message}: ${JSON.stringify(token.source)}` : token.message;
				const error = new YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg);
				if (this.atDirectives || !this.doc) this.errors.push(error);
				else this.doc.errors.push(error);
				break;
			}
			case "doc-end": {
				if (!this.doc) {
					this.errors.push(new YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", "Unexpected doc-end without preceding document"));
					break;
				}
				this.doc.directives.docEnd = true;
				const end = resolveEnd(token.end, token.offset + token.source.length, this.doc.options.strict, this.onError);
				this.decorate(this.doc, true);
				if (end.comment) {
					const dc = this.doc.comment;
					this.doc.comment = dc ? `${dc}\n${end.comment}` : end.comment;
				}
				this.doc.range[2] = end.offset;
				break;
			}
			default: this.errors.push(new YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", `Unsupported token ${token.type}`));
		}
	}
	*end(forceDoc = false, endOffset = -1) {
		if (this.doc) {
			this.decorate(this.doc, true);
			yield this.doc;
			this.doc = null;
		} else if (forceDoc) {
			const doc = new Document(void 0, Object.assign({ _directives: this.directives }, this.options));
			if (this.atDirectives) this.onError(endOffset, "MISSING_CHAR", "Missing directives-end indicator line");
			doc.range = [
				0,
				endOffset,
				endOffset
			];
			this.decorate(doc, false);
			yield doc;
		}
	}
};
var BREAK = Symbol("break visit");
var SKIP = Symbol("skip children");
var REMOVE = Symbol("remove item");
function visit(cst, visitor) {
	if ("type" in cst && cst.type === "document") cst = {
		start: cst.start,
		value: cst.value
	};
	_visit(Object.freeze([]), cst, visitor);
}
visit.BREAK = BREAK;
visit.SKIP = SKIP;
visit.REMOVE = REMOVE;
visit.itemAtPath = (cst, path$1) => {
	let item = cst;
	for (const [field, index] of path$1) {
		const tok = item?.[field];
		if (tok && "items" in tok) item = tok.items[index];
		else return void 0;
	}
	return item;
};
visit.parentCollection = (cst, path$1) => {
	const parent = visit.itemAtPath(cst, path$1.slice(0, -1));
	const field = path$1[path$1.length - 1][0];
	const coll = parent?.[field];
	if (coll && "items" in coll) return coll;
	throw new Error("Parent collection not found");
};
function _visit(path$1, item, visitor) {
	let ctrl = visitor(item, path$1);
	if (typeof ctrl === "symbol") return ctrl;
	for (const field of ["key", "value"]) {
		const token = item[field];
		if (token && "items" in token) {
			for (let i = 0; i < token.items.length; ++i) {
				const ci = _visit(Object.freeze(path$1.concat([[field, i]])), token.items[i], visitor);
				if (typeof ci === "number") i = ci - 1;
				else if (ci === BREAK) return BREAK;
				else if (ci === REMOVE) {
					token.items.splice(i, 1);
					i -= 1;
				}
			}
			if (typeof ctrl === "function" && field === "key") ctrl = ctrl(item, path$1);
		}
	}
	return typeof ctrl === "function" ? ctrl(item, path$1) : ctrl;
}
function tokenType(source) {
	switch (source) {
		case "﻿": return "byte-order-mark";
		case "": return "doc-mode";
		case "": return "flow-error-end";
		case "": return "scalar";
		case "---": return "doc-start";
		case "...": return "doc-end";
		case "":
		case "\n":
		case "\r\n": return "newline";
		case "-": return "seq-item-ind";
		case "?": return "explicit-key-ind";
		case ":": return "map-value-ind";
		case "{": return "flow-map-start";
		case "}": return "flow-map-end";
		case "[": return "flow-seq-start";
		case "]": return "flow-seq-end";
		case ",": return "comma";
	}
	switch (source[0]) {
		case " ":
		case "	": return "space";
		case "#": return "comment";
		case "%": return "directive-line";
		case "*": return "alias";
		case "&": return "anchor";
		case "!": return "tag";
		case "'": return "single-quoted-scalar";
		case "\"": return "double-quoted-scalar";
		case "|":
		case ">": return "block-scalar-header";
	}
	return null;
}
function isEmpty$2(ch) {
	switch (ch) {
		case void 0:
		case " ":
		case "\n":
		case "\r":
		case "	": return true;
		default: return false;
	}
}
var hexDigits = /* @__PURE__ */ new Set("0123456789ABCDEFabcdef");
var tagChars = /* @__PURE__ */ new Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()");
var flowIndicatorChars = /* @__PURE__ */ new Set(",[]{}");
var invalidAnchorChars = /* @__PURE__ */ new Set(" ,[]{}\n\r	");
var isNotAnchorChar = (ch) => !ch || invalidAnchorChars.has(ch);
var Lexer = class {
	constructor() {
		this.atEnd = false;
		this.blockScalarIndent = -1;
		this.blockScalarKeep = false;
		this.buffer = "";
		this.flowKey = false;
		this.flowLevel = 0;
		this.indentNext = 0;
		this.indentValue = 0;
		this.lineEndPos = null;
		this.next = null;
		this.pos = 0;
	}
	*lex(source, incomplete = false) {
		if (source) {
			if (typeof source !== "string") throw TypeError("source is not a string");
			this.buffer = this.buffer ? this.buffer + source : source;
			this.lineEndPos = null;
		}
		this.atEnd = !incomplete;
		let next = this.next ?? "stream";
		while (next && (incomplete || this.hasChars(1))) next = yield* this.parseNext(next);
	}
	atLineEnd() {
		let i = this.pos;
		let ch = this.buffer[i];
		while (ch === " " || ch === "	") ch = this.buffer[++i];
		if (!ch || ch === "#" || ch === "\n") return true;
		if (ch === "\r") return this.buffer[i + 1] === "\n";
		return false;
	}
	charAt(n) {
		return this.buffer[this.pos + n];
	}
	continueScalar(offset$1) {
		let ch = this.buffer[offset$1];
		if (this.indentNext > 0) {
			let indent = 0;
			while (ch === " ") ch = this.buffer[++indent + offset$1];
			if (ch === "\r") {
				const next = this.buffer[indent + offset$1 + 1];
				if (next === "\n" || !next && !this.atEnd) return offset$1 + indent + 1;
			}
			return ch === "\n" || indent >= this.indentNext || !ch && !this.atEnd ? offset$1 + indent : -1;
		}
		if (ch === "-" || ch === ".") {
			const dt = this.buffer.substr(offset$1, 3);
			if ((dt === "---" || dt === "...") && isEmpty$2(this.buffer[offset$1 + 3])) return -1;
		}
		return offset$1;
	}
	getLine() {
		let end = this.lineEndPos;
		if (typeof end !== "number" || end !== -1 && end < this.pos) {
			end = this.buffer.indexOf("\n", this.pos);
			this.lineEndPos = end;
		}
		if (end === -1) return this.atEnd ? this.buffer.substring(this.pos) : null;
		if (this.buffer[end - 1] === "\r") end -= 1;
		return this.buffer.substring(this.pos, end);
	}
	hasChars(n) {
		return this.pos + n <= this.buffer.length;
	}
	setNext(state) {
		this.buffer = this.buffer.substring(this.pos);
		this.pos = 0;
		this.lineEndPos = null;
		this.next = state;
		return null;
	}
	peek(n) {
		return this.buffer.substr(this.pos, n);
	}
	*parseNext(next) {
		switch (next) {
			case "stream": return yield* this.parseStream();
			case "line-start": return yield* this.parseLineStart();
			case "block-start": return yield* this.parseBlockStart();
			case "doc": return yield* this.parseDocument();
			case "flow": return yield* this.parseFlowCollection();
			case "quoted-scalar": return yield* this.parseQuotedScalar();
			case "block-scalar": return yield* this.parseBlockScalar();
			case "plain-scalar": return yield* this.parsePlainScalar();
		}
	}
	*parseStream() {
		let line = this.getLine();
		if (line === null) return this.setNext("stream");
		if (line[0] === "﻿") {
			yield* this.pushCount(1);
			line = line.substring(1);
		}
		if (line[0] === "%") {
			let dirEnd = line.length;
			let cs = line.indexOf("#");
			while (cs !== -1) {
				const ch = line[cs - 1];
				if (ch === " " || ch === "	") {
					dirEnd = cs - 1;
					break;
				} else cs = line.indexOf("#", cs + 1);
			}
			while (true) {
				const ch = line[dirEnd - 1];
				if (ch === " " || ch === "	") dirEnd -= 1;
				else break;
			}
			const n = (yield* this.pushCount(dirEnd)) + (yield* this.pushSpaces(true));
			yield* this.pushCount(line.length - n);
			this.pushNewline();
			return "stream";
		}
		if (this.atLineEnd()) {
			const sp = yield* this.pushSpaces(true);
			yield* this.pushCount(line.length - sp);
			yield* this.pushNewline();
			return "stream";
		}
		yield "";
		return yield* this.parseLineStart();
	}
	*parseLineStart() {
		const ch = this.charAt(0);
		if (!ch && !this.atEnd) return this.setNext("line-start");
		if (ch === "-" || ch === ".") {
			if (!this.atEnd && !this.hasChars(4)) return this.setNext("line-start");
			const s = this.peek(3);
			if ((s === "---" || s === "...") && isEmpty$2(this.charAt(3))) {
				yield* this.pushCount(3);
				this.indentValue = 0;
				this.indentNext = 0;
				return s === "---" ? "doc" : "stream";
			}
		}
		this.indentValue = yield* this.pushSpaces(false);
		if (this.indentNext > this.indentValue && !isEmpty$2(this.charAt(1))) this.indentNext = this.indentValue;
		return yield* this.parseBlockStart();
	}
	*parseBlockStart() {
		const [ch0, ch1] = this.peek(2);
		if (!ch1 && !this.atEnd) return this.setNext("block-start");
		if ((ch0 === "-" || ch0 === "?" || ch0 === ":") && isEmpty$2(ch1)) {
			const n = (yield* this.pushCount(1)) + (yield* this.pushSpaces(true));
			this.indentNext = this.indentValue + 1;
			this.indentValue += n;
			return yield* this.parseBlockStart();
		}
		return "doc";
	}
	*parseDocument() {
		yield* this.pushSpaces(true);
		const line = this.getLine();
		if (line === null) return this.setNext("doc");
		let n = yield* this.pushIndicators();
		switch (line[n]) {
			case "#": yield* this.pushCount(line.length - n);
			case void 0:
				yield* this.pushNewline();
				return yield* this.parseLineStart();
			case "{":
			case "[":
				yield* this.pushCount(1);
				this.flowKey = false;
				this.flowLevel = 1;
				return "flow";
			case "}":
			case "]":
				yield* this.pushCount(1);
				return "doc";
			case "*":
				yield* this.pushUntil(isNotAnchorChar);
				return "doc";
			case "\"":
			case "'": return yield* this.parseQuotedScalar();
			case "|":
			case ">":
				n += yield* this.parseBlockScalarHeader();
				n += yield* this.pushSpaces(true);
				yield* this.pushCount(line.length - n);
				yield* this.pushNewline();
				return yield* this.parseBlockScalar();
			default: return yield* this.parsePlainScalar();
		}
	}
	*parseFlowCollection() {
		let nl, sp;
		let indent = -1;
		do {
			nl = yield* this.pushNewline();
			if (nl > 0) {
				sp = yield* this.pushSpaces(false);
				this.indentValue = indent = sp;
			} else sp = 0;
			sp += yield* this.pushSpaces(true);
		} while (nl + sp > 0);
		const line = this.getLine();
		if (line === null) return this.setNext("flow");
		if (indent !== -1 && indent < this.indentNext && line[0] !== "#" || indent === 0 && (line.startsWith("---") || line.startsWith("...")) && isEmpty$2(line[3])) {
			if (!(indent === this.indentNext - 1 && this.flowLevel === 1 && (line[0] === "]" || line[0] === "}"))) {
				this.flowLevel = 0;
				yield "";
				return yield* this.parseLineStart();
			}
		}
		let n = 0;
		while (line[n] === ",") {
			n += yield* this.pushCount(1);
			n += yield* this.pushSpaces(true);
			this.flowKey = false;
		}
		n += yield* this.pushIndicators();
		switch (line[n]) {
			case void 0: return "flow";
			case "#":
				yield* this.pushCount(line.length - n);
				return "flow";
			case "{":
			case "[":
				yield* this.pushCount(1);
				this.flowKey = false;
				this.flowLevel += 1;
				return "flow";
			case "}":
			case "]":
				yield* this.pushCount(1);
				this.flowKey = true;
				this.flowLevel -= 1;
				return this.flowLevel ? "flow" : "doc";
			case "*":
				yield* this.pushUntil(isNotAnchorChar);
				return "flow";
			case "\"":
			case "'":
				this.flowKey = true;
				return yield* this.parseQuotedScalar();
			case ":": {
				const next = this.charAt(1);
				if (this.flowKey || isEmpty$2(next) || next === ",") {
					this.flowKey = false;
					yield* this.pushCount(1);
					yield* this.pushSpaces(true);
					return "flow";
				}
			}
			default:
				this.flowKey = false;
				return yield* this.parsePlainScalar();
		}
	}
	*parseQuotedScalar() {
		const quote = this.charAt(0);
		let end = this.buffer.indexOf(quote, this.pos + 1);
		if (quote === "'") while (end !== -1 && this.buffer[end + 1] === "'") end = this.buffer.indexOf("'", end + 2);
		else while (end !== -1) {
			let n = 0;
			while (this.buffer[end - 1 - n] === "\\") n += 1;
			if (n % 2 === 0) break;
			end = this.buffer.indexOf("\"", end + 1);
		}
		const qb = this.buffer.substring(0, end);
		let nl = qb.indexOf("\n", this.pos);
		if (nl !== -1) {
			while (nl !== -1) {
				const cs = this.continueScalar(nl + 1);
				if (cs === -1) break;
				nl = qb.indexOf("\n", cs);
			}
			if (nl !== -1) end = nl - (qb[nl - 1] === "\r" ? 2 : 1);
		}
		if (end === -1) {
			if (!this.atEnd) return this.setNext("quoted-scalar");
			end = this.buffer.length;
		}
		yield* this.pushToIndex(end + 1, false);
		return this.flowLevel ? "flow" : "doc";
	}
	*parseBlockScalarHeader() {
		this.blockScalarIndent = -1;
		this.blockScalarKeep = false;
		let i = this.pos;
		while (true) {
			const ch = this.buffer[++i];
			if (ch === "+") this.blockScalarKeep = true;
			else if (ch > "0" && ch <= "9") this.blockScalarIndent = Number(ch) - 1;
			else if (ch !== "-") break;
		}
		return yield* this.pushUntil((ch) => isEmpty$2(ch) || ch === "#");
	}
	*parseBlockScalar() {
		let nl = this.pos - 1;
		let indent = 0;
		let ch;
		loop: for (let i$1 = this.pos; ch = this.buffer[i$1]; ++i$1) switch (ch) {
			case " ":
				indent += 1;
				break;
			case "\n":
				nl = i$1;
				indent = 0;
				break;
			case "\r": {
				const next = this.buffer[i$1 + 1];
				if (!next && !this.atEnd) return this.setNext("block-scalar");
				if (next === "\n") break;
			}
			default: break loop;
		}
		if (!ch && !this.atEnd) return this.setNext("block-scalar");
		if (indent >= this.indentNext) {
			if (this.blockScalarIndent === -1) this.indentNext = indent;
			else this.indentNext = this.blockScalarIndent + (this.indentNext === 0 ? 1 : this.indentNext);
			do {
				const cs = this.continueScalar(nl + 1);
				if (cs === -1) break;
				nl = this.buffer.indexOf("\n", cs);
			} while (nl !== -1);
			if (nl === -1) {
				if (!this.atEnd) return this.setNext("block-scalar");
				nl = this.buffer.length;
			}
		}
		let i = nl + 1;
		ch = this.buffer[i];
		while (ch === " ") ch = this.buffer[++i];
		if (ch === "	") {
			while (ch === "	" || ch === " " || ch === "\r" || ch === "\n") ch = this.buffer[++i];
			nl = i - 1;
		} else if (!this.blockScalarKeep) do {
			let i$1 = nl - 1;
			let ch$1 = this.buffer[i$1];
			if (ch$1 === "\r") ch$1 = this.buffer[--i$1];
			const lastChar = i$1;
			while (ch$1 === " ") ch$1 = this.buffer[--i$1];
			if (ch$1 === "\n" && i$1 >= this.pos && i$1 + 1 + indent > lastChar) nl = i$1;
			else break;
		} while (true);
		yield "";
		yield* this.pushToIndex(nl + 1, true);
		return yield* this.parseLineStart();
	}
	*parsePlainScalar() {
		const inFlow = this.flowLevel > 0;
		let end = this.pos - 1;
		let i = this.pos - 1;
		let ch;
		while (ch = this.buffer[++i]) if (ch === ":") {
			const next = this.buffer[i + 1];
			if (isEmpty$2(next) || inFlow && flowIndicatorChars.has(next)) break;
			end = i;
		} else if (isEmpty$2(ch)) {
			let next = this.buffer[i + 1];
			if (ch === "\r") if (next === "\n") {
				i += 1;
				ch = "\n";
				next = this.buffer[i + 1];
			} else end = i;
			if (next === "#" || inFlow && flowIndicatorChars.has(next)) break;
			if (ch === "\n") {
				const cs = this.continueScalar(i + 1);
				if (cs === -1) break;
				i = Math.max(i, cs - 2);
			}
		} else {
			if (inFlow && flowIndicatorChars.has(ch)) break;
			end = i;
		}
		if (!ch && !this.atEnd) return this.setNext("plain-scalar");
		yield "";
		yield* this.pushToIndex(end + 1, true);
		return inFlow ? "flow" : "doc";
	}
	*pushCount(n) {
		if (n > 0) {
			yield this.buffer.substr(this.pos, n);
			this.pos += n;
			return n;
		}
		return 0;
	}
	*pushToIndex(i, allowEmpty) {
		const s = this.buffer.slice(this.pos, i);
		if (s) {
			yield s;
			this.pos += s.length;
			return s.length;
		} else if (allowEmpty) yield "";
		return 0;
	}
	*pushIndicators() {
		switch (this.charAt(0)) {
			case "!": return (yield* this.pushTag()) + (yield* this.pushSpaces(true)) + (yield* this.pushIndicators());
			case "&": return (yield* this.pushUntil(isNotAnchorChar)) + (yield* this.pushSpaces(true)) + (yield* this.pushIndicators());
			case "-":
			case "?":
			case ":": {
				const inFlow = this.flowLevel > 0;
				const ch1 = this.charAt(1);
				if (isEmpty$2(ch1) || inFlow && flowIndicatorChars.has(ch1)) {
					if (!inFlow) this.indentNext = this.indentValue + 1;
					else if (this.flowKey) this.flowKey = false;
					return (yield* this.pushCount(1)) + (yield* this.pushSpaces(true)) + (yield* this.pushIndicators());
				}
			}
		}
		return 0;
	}
	*pushTag() {
		if (this.charAt(1) === "<") {
			let i = this.pos + 2;
			let ch = this.buffer[i];
			while (!isEmpty$2(ch) && ch !== ">") ch = this.buffer[++i];
			return yield* this.pushToIndex(ch === ">" ? i + 1 : i, false);
		} else {
			let i = this.pos + 1;
			let ch = this.buffer[i];
			while (ch) if (tagChars.has(ch)) ch = this.buffer[++i];
			else if (ch === "%" && hexDigits.has(this.buffer[i + 1]) && hexDigits.has(this.buffer[i + 2])) ch = this.buffer[i += 3];
			else break;
			return yield* this.pushToIndex(i, false);
		}
	}
	*pushNewline() {
		const ch = this.buffer[this.pos];
		if (ch === "\n") return yield* this.pushCount(1);
		else if (ch === "\r" && this.charAt(1) === "\n") return yield* this.pushCount(2);
		else return 0;
	}
	*pushSpaces(allowTabs) {
		let i = this.pos - 1;
		let ch;
		do
			ch = this.buffer[++i];
		while (ch === " " || allowTabs && ch === "	");
		const n = i - this.pos;
		if (n > 0) {
			yield this.buffer.substr(this.pos, n);
			this.pos = i;
		}
		return n;
	}
	*pushUntil(test) {
		let i = this.pos;
		let ch = this.buffer[i];
		while (!test(ch)) ch = this.buffer[++i];
		return yield* this.pushToIndex(i, false);
	}
};
var LineCounter = class {
	constructor() {
		this.lineStarts = [];
		this.addNewLine = (offset$1) => this.lineStarts.push(offset$1);
		this.linePos = (offset$1) => {
			let low = 0;
			let high = this.lineStarts.length;
			while (low < high) {
				const mid = low + high >> 1;
				if (this.lineStarts[mid] < offset$1) low = mid + 1;
				else high = mid;
			}
			if (this.lineStarts[low] === offset$1) return {
				line: low + 1,
				col: 1
			};
			if (low === 0) return {
				line: 0,
				col: offset$1
			};
			const start = this.lineStarts[low - 1];
			return {
				line: low,
				col: offset$1 - start + 1
			};
		};
	}
};
function includesToken(list, type) {
	for (let i = 0; i < list.length; ++i) if (list[i].type === type) return true;
	return false;
}
function findNonEmptyIndex(list) {
	for (let i = 0; i < list.length; ++i) switch (list[i].type) {
		case "space":
		case "comment":
		case "newline": break;
		default: return i;
	}
	return -1;
}
function isFlowToken(token) {
	switch (token?.type) {
		case "alias":
		case "scalar":
		case "single-quoted-scalar":
		case "double-quoted-scalar":
		case "flow-collection": return true;
		default: return false;
	}
}
function getPrevProps(parent) {
	switch (parent.type) {
		case "document": return parent.start;
		case "block-map": {
			const it = parent.items[parent.items.length - 1];
			return it.sep ?? it.start;
		}
		case "block-seq": return parent.items[parent.items.length - 1].start;
		default: return [];
	}
}
function getFirstKeyStartProps(prev) {
	if (prev.length === 0) return [];
	let i = prev.length;
	loop: while (--i >= 0) switch (prev[i].type) {
		case "doc-start":
		case "explicit-key-ind":
		case "map-value-ind":
		case "seq-item-ind":
		case "newline": break loop;
	}
	while (prev[++i]?.type === "space");
	return prev.splice(i, prev.length);
}
function fixFlowSeqItems(fc) {
	if (fc.start.type === "flow-seq-start") {
		for (const it of fc.items) if (it.sep && !it.value && !includesToken(it.start, "explicit-key-ind") && !includesToken(it.sep, "map-value-ind")) {
			if (it.key) it.value = it.key;
			delete it.key;
			if (isFlowToken(it.value)) if (it.value.end) Array.prototype.push.apply(it.value.end, it.sep);
			else it.value.end = it.sep;
			else Array.prototype.push.apply(it.start, it.sep);
			delete it.sep;
		}
	}
}
var Parser$2 = class {
	constructor(onNewLine) {
		this.atNewLine = true;
		this.atScalar = false;
		this.indent = 0;
		this.offset = 0;
		this.onKeyLine = false;
		this.stack = [];
		this.source = "";
		this.type = "";
		this.lexer = new Lexer();
		this.onNewLine = onNewLine;
	}
	*parse(source, incomplete = false) {
		if (this.onNewLine && this.offset === 0) this.onNewLine(0);
		for (const lexeme of this.lexer.lex(source, incomplete)) yield* this.next(lexeme);
		if (!incomplete) yield* this.end();
	}
	*next(source) {
		this.source = source;
		if (this.atScalar) {
			this.atScalar = false;
			yield* this.step();
			this.offset += source.length;
			return;
		}
		const type = tokenType(source);
		if (!type) {
			const message = `Not a YAML token: ${source}`;
			yield* this.pop({
				type: "error",
				offset: this.offset,
				message,
				source
			});
			this.offset += source.length;
		} else if (type === "scalar") {
			this.atNewLine = false;
			this.atScalar = true;
			this.type = "scalar";
		} else {
			this.type = type;
			yield* this.step();
			switch (type) {
				case "newline":
					this.atNewLine = true;
					this.indent = 0;
					if (this.onNewLine) this.onNewLine(this.offset + source.length);
					break;
				case "space":
					if (this.atNewLine && source[0] === " ") this.indent += source.length;
					break;
				case "explicit-key-ind":
				case "map-value-ind":
				case "seq-item-ind":
					if (this.atNewLine) this.indent += source.length;
					break;
				case "doc-mode":
				case "flow-error-end": return;
				default: this.atNewLine = false;
			}
			this.offset += source.length;
		}
	}
	*end() {
		while (this.stack.length > 0) yield* this.pop();
	}
	get sourceToken() {
		return {
			type: this.type,
			offset: this.offset,
			indent: this.indent,
			source: this.source
		};
	}
	*step() {
		const top = this.peek(1);
		if (this.type === "doc-end" && (!top || top.type !== "doc-end")) {
			while (this.stack.length > 0) yield* this.pop();
			this.stack.push({
				type: "doc-end",
				offset: this.offset,
				source: this.source
			});
			return;
		}
		if (!top) return yield* this.stream();
		switch (top.type) {
			case "document": return yield* this.document(top);
			case "alias":
			case "scalar":
			case "single-quoted-scalar":
			case "double-quoted-scalar": return yield* this.scalar(top);
			case "block-scalar": return yield* this.blockScalar(top);
			case "block-map": return yield* this.blockMap(top);
			case "block-seq": return yield* this.blockSequence(top);
			case "flow-collection": return yield* this.flowCollection(top);
			case "doc-end": return yield* this.documentEnd(top);
		}
		/* istanbul ignore next should not happen */
		yield* this.pop();
	}
	peek(n) {
		return this.stack[this.stack.length - n];
	}
	*pop(error) {
		const token = error ?? this.stack.pop();
		/* istanbul ignore if should not happen */
		if (!token) yield {
			type: "error",
			offset: this.offset,
			source: "",
			message: "Tried to pop an empty stack"
		};
		else if (this.stack.length === 0) yield token;
		else {
			const top = this.peek(1);
			if (token.type === "block-scalar") token.indent = "indent" in top ? top.indent : 0;
			else if (token.type === "flow-collection" && top.type === "document") token.indent = 0;
			if (token.type === "flow-collection") fixFlowSeqItems(token);
			switch (top.type) {
				case "document":
					top.value = token;
					break;
				case "block-scalar":
					top.props.push(token);
					break;
				case "block-map": {
					const it = top.items[top.items.length - 1];
					if (it.value) {
						top.items.push({
							start: [],
							key: token,
							sep: []
						});
						this.onKeyLine = true;
						return;
					} else if (it.sep) it.value = token;
					else {
						Object.assign(it, {
							key: token,
							sep: []
						});
						this.onKeyLine = !it.explicitKey;
						return;
					}
					break;
				}
				case "block-seq": {
					const it = top.items[top.items.length - 1];
					if (it.value) top.items.push({
						start: [],
						value: token
					});
					else it.value = token;
					break;
				}
				case "flow-collection": {
					const it = top.items[top.items.length - 1];
					if (!it || it.value) top.items.push({
						start: [],
						key: token,
						sep: []
					});
					else if (it.sep) it.value = token;
					else Object.assign(it, {
						key: token,
						sep: []
					});
					return;
				}
				default:
					yield* this.pop();
					yield* this.pop(token);
			}
			if ((top.type === "document" || top.type === "block-map" || top.type === "block-seq") && (token.type === "block-map" || token.type === "block-seq")) {
				const last$2 = token.items[token.items.length - 1];
				if (last$2 && !last$2.sep && !last$2.value && last$2.start.length > 0 && findNonEmptyIndex(last$2.start) === -1 && (token.indent === 0 || last$2.start.every((st) => st.type !== "comment" || st.indent < token.indent))) {
					if (top.type === "document") top.end = last$2.start;
					else top.items.push({ start: last$2.start });
					token.items.splice(-1, 1);
				}
			}
		}
	}
	*stream() {
		switch (this.type) {
			case "directive-line":
				yield {
					type: "directive",
					offset: this.offset,
					source: this.source
				};
				return;
			case "byte-order-mark":
			case "space":
			case "comment":
			case "newline":
				yield this.sourceToken;
				return;
			case "doc-mode":
			case "doc-start": {
				const doc = {
					type: "document",
					offset: this.offset,
					start: []
				};
				if (this.type === "doc-start") doc.start.push(this.sourceToken);
				this.stack.push(doc);
				return;
			}
		}
		yield {
			type: "error",
			offset: this.offset,
			message: `Unexpected ${this.type} token in YAML stream`,
			source: this.source
		};
	}
	*document(doc) {
		if (doc.value) return yield* this.lineEnd(doc);
		switch (this.type) {
			case "doc-start":
				if (findNonEmptyIndex(doc.start) !== -1) {
					yield* this.pop();
					yield* this.step();
				} else doc.start.push(this.sourceToken);
				return;
			case "anchor":
			case "tag":
			case "space":
			case "comment":
			case "newline":
				doc.start.push(this.sourceToken);
				return;
		}
		const bv = this.startBlockValue(doc);
		if (bv) this.stack.push(bv);
		else yield {
			type: "error",
			offset: this.offset,
			message: `Unexpected ${this.type} token in YAML document`,
			source: this.source
		};
	}
	*scalar(scalar) {
		if (this.type === "map-value-ind") {
			const start = getFirstKeyStartProps(getPrevProps(this.peek(2)));
			let sep$1;
			if (scalar.end) {
				sep$1 = scalar.end;
				sep$1.push(this.sourceToken);
				delete scalar.end;
			} else sep$1 = [this.sourceToken];
			const map$2 = {
				type: "block-map",
				offset: scalar.offset,
				indent: scalar.indent,
				items: [{
					start,
					key: scalar,
					sep: sep$1
				}]
			};
			this.onKeyLine = true;
			this.stack[this.stack.length - 1] = map$2;
		} else yield* this.lineEnd(scalar);
	}
	*blockScalar(scalar) {
		switch (this.type) {
			case "space":
			case "comment":
			case "newline":
				scalar.props.push(this.sourceToken);
				return;
			case "scalar":
				scalar.source = this.source;
				this.atNewLine = true;
				this.indent = 0;
				if (this.onNewLine) {
					let nl = this.source.indexOf("\n") + 1;
					while (nl !== 0) {
						this.onNewLine(this.offset + nl);
						nl = this.source.indexOf("\n", nl) + 1;
					}
				}
				yield* this.pop();
				break;
			default:
				yield* this.pop();
				yield* this.step();
		}
	}
	*blockMap(map$2) {
		const it = map$2.items[map$2.items.length - 1];
		switch (this.type) {
			case "newline":
				this.onKeyLine = false;
				if (it.value) {
					const end = "end" in it.value ? it.value.end : void 0;
					if ((Array.isArray(end) ? end[end.length - 1] : void 0)?.type === "comment") end?.push(this.sourceToken);
					else map$2.items.push({ start: [this.sourceToken] });
				} else if (it.sep) it.sep.push(this.sourceToken);
				else it.start.push(this.sourceToken);
				return;
			case "space":
			case "comment":
				if (it.value) map$2.items.push({ start: [this.sourceToken] });
				else if (it.sep) it.sep.push(this.sourceToken);
				else {
					if (this.atIndentedComment(it.start, map$2.indent)) {
						const end = map$2.items[map$2.items.length - 2]?.value?.end;
						if (Array.isArray(end)) {
							Array.prototype.push.apply(end, it.start);
							end.push(this.sourceToken);
							map$2.items.pop();
							return;
						}
					}
					it.start.push(this.sourceToken);
				}
				return;
		}
		if (this.indent >= map$2.indent) {
			const atMapIndent = !this.onKeyLine && this.indent === map$2.indent;
			const atNextItem = atMapIndent && (it.sep || it.explicitKey) && this.type !== "seq-item-ind";
			let start = [];
			if (atNextItem && it.sep && !it.value) {
				const nl = [];
				for (let i = 0; i < it.sep.length; ++i) {
					const st = it.sep[i];
					switch (st.type) {
						case "newline":
							nl.push(i);
							break;
						case "space": break;
						case "comment":
							if (st.indent > map$2.indent) nl.length = 0;
							break;
						default: nl.length = 0;
					}
				}
				if (nl.length >= 2) start = it.sep.splice(nl[1]);
			}
			switch (this.type) {
				case "anchor":
				case "tag":
					if (atNextItem || it.value) {
						start.push(this.sourceToken);
						map$2.items.push({ start });
						this.onKeyLine = true;
					} else if (it.sep) it.sep.push(this.sourceToken);
					else it.start.push(this.sourceToken);
					return;
				case "explicit-key-ind":
					if (!it.sep && !it.explicitKey) {
						it.start.push(this.sourceToken);
						it.explicitKey = true;
					} else if (atNextItem || it.value) {
						start.push(this.sourceToken);
						map$2.items.push({
							start,
							explicitKey: true
						});
					} else this.stack.push({
						type: "block-map",
						offset: this.offset,
						indent: this.indent,
						items: [{
							start: [this.sourceToken],
							explicitKey: true
						}]
					});
					this.onKeyLine = true;
					return;
				case "map-value-ind":
					if (it.explicitKey) if (!it.sep) if (includesToken(it.start, "newline")) Object.assign(it, {
						key: null,
						sep: [this.sourceToken]
					});
					else {
						const start$1 = getFirstKeyStartProps(it.start);
						this.stack.push({
							type: "block-map",
							offset: this.offset,
							indent: this.indent,
							items: [{
								start: start$1,
								key: null,
								sep: [this.sourceToken]
							}]
						});
					}
					else if (it.value) map$2.items.push({
						start: [],
						key: null,
						sep: [this.sourceToken]
					});
					else if (includesToken(it.sep, "map-value-ind")) this.stack.push({
						type: "block-map",
						offset: this.offset,
						indent: this.indent,
						items: [{
							start,
							key: null,
							sep: [this.sourceToken]
						}]
					});
					else if (isFlowToken(it.key) && !includesToken(it.sep, "newline")) {
						const start$1 = getFirstKeyStartProps(it.start);
						const key = it.key;
						const sep$1 = it.sep;
						sep$1.push(this.sourceToken);
						delete it.key;
						delete it.sep;
						this.stack.push({
							type: "block-map",
							offset: this.offset,
							indent: this.indent,
							items: [{
								start: start$1,
								key,
								sep: sep$1
							}]
						});
					} else if (start.length > 0) it.sep = it.sep.concat(start, this.sourceToken);
					else it.sep.push(this.sourceToken);
					else if (!it.sep) Object.assign(it, {
						key: null,
						sep: [this.sourceToken]
					});
					else if (it.value || atNextItem) map$2.items.push({
						start,
						key: null,
						sep: [this.sourceToken]
					});
					else if (includesToken(it.sep, "map-value-ind")) this.stack.push({
						type: "block-map",
						offset: this.offset,
						indent: this.indent,
						items: [{
							start: [],
							key: null,
							sep: [this.sourceToken]
						}]
					});
					else it.sep.push(this.sourceToken);
					this.onKeyLine = true;
					return;
				case "alias":
				case "scalar":
				case "single-quoted-scalar":
				case "double-quoted-scalar": {
					const fs$2 = this.flowScalar(this.type);
					if (atNextItem || it.value) {
						map$2.items.push({
							start,
							key: fs$2,
							sep: []
						});
						this.onKeyLine = true;
					} else if (it.sep) this.stack.push(fs$2);
					else {
						Object.assign(it, {
							key: fs$2,
							sep: []
						});
						this.onKeyLine = true;
					}
					return;
				}
				default: {
					const bv = this.startBlockValue(map$2);
					if (bv) {
						if (bv.type === "block-seq") {
							if (!it.explicitKey && it.sep && !includesToken(it.sep, "newline")) {
								yield* this.pop({
									type: "error",
									offset: this.offset,
									message: "Unexpected block-seq-ind on same line with key",
									source: this.source
								});
								return;
							}
						} else if (atMapIndent) map$2.items.push({ start });
						this.stack.push(bv);
						return;
					}
				}
			}
		}
		yield* this.pop();
		yield* this.step();
	}
	*blockSequence(seq$1) {
		const it = seq$1.items[seq$1.items.length - 1];
		switch (this.type) {
			case "newline":
				if (it.value) {
					const end = "end" in it.value ? it.value.end : void 0;
					if ((Array.isArray(end) ? end[end.length - 1] : void 0)?.type === "comment") end?.push(this.sourceToken);
					else seq$1.items.push({ start: [this.sourceToken] });
				} else it.start.push(this.sourceToken);
				return;
			case "space":
			case "comment":
				if (it.value) seq$1.items.push({ start: [this.sourceToken] });
				else {
					if (this.atIndentedComment(it.start, seq$1.indent)) {
						const end = seq$1.items[seq$1.items.length - 2]?.value?.end;
						if (Array.isArray(end)) {
							Array.prototype.push.apply(end, it.start);
							end.push(this.sourceToken);
							seq$1.items.pop();
							return;
						}
					}
					it.start.push(this.sourceToken);
				}
				return;
			case "anchor":
			case "tag":
				if (it.value || this.indent <= seq$1.indent) break;
				it.start.push(this.sourceToken);
				return;
			case "seq-item-ind":
				if (this.indent !== seq$1.indent) break;
				if (it.value || includesToken(it.start, "seq-item-ind")) seq$1.items.push({ start: [this.sourceToken] });
				else it.start.push(this.sourceToken);
				return;
		}
		if (this.indent > seq$1.indent) {
			const bv = this.startBlockValue(seq$1);
			if (bv) {
				this.stack.push(bv);
				return;
			}
		}
		yield* this.pop();
		yield* this.step();
	}
	*flowCollection(fc) {
		const it = fc.items[fc.items.length - 1];
		if (this.type === "flow-error-end") {
			let top;
			do {
				yield* this.pop();
				top = this.peek(1);
			} while (top && top.type === "flow-collection");
		} else if (fc.end.length === 0) {
			switch (this.type) {
				case "comma":
				case "explicit-key-ind":
					if (!it || it.sep) fc.items.push({ start: [this.sourceToken] });
					else it.start.push(this.sourceToken);
					return;
				case "map-value-ind":
					if (!it || it.value) fc.items.push({
						start: [],
						key: null,
						sep: [this.sourceToken]
					});
					else if (it.sep) it.sep.push(this.sourceToken);
					else Object.assign(it, {
						key: null,
						sep: [this.sourceToken]
					});
					return;
				case "space":
				case "comment":
				case "newline":
				case "anchor":
				case "tag":
					if (!it || it.value) fc.items.push({ start: [this.sourceToken] });
					else if (it.sep) it.sep.push(this.sourceToken);
					else it.start.push(this.sourceToken);
					return;
				case "alias":
				case "scalar":
				case "single-quoted-scalar":
				case "double-quoted-scalar": {
					const fs$2 = this.flowScalar(this.type);
					if (!it || it.value) fc.items.push({
						start: [],
						key: fs$2,
						sep: []
					});
					else if (it.sep) this.stack.push(fs$2);
					else Object.assign(it, {
						key: fs$2,
						sep: []
					});
					return;
				}
				case "flow-map-end":
				case "flow-seq-end":
					fc.end.push(this.sourceToken);
					return;
			}
			const bv = this.startBlockValue(fc);
			/* istanbul ignore else should not happen */
			if (bv) this.stack.push(bv);
			else {
				yield* this.pop();
				yield* this.step();
			}
		} else {
			const parent = this.peek(2);
			if (parent.type === "block-map" && (this.type === "map-value-ind" && parent.indent === fc.indent || this.type === "newline" && !parent.items[parent.items.length - 1].sep)) {
				yield* this.pop();
				yield* this.step();
			} else if (this.type === "map-value-ind" && parent.type !== "flow-collection") {
				const start = getFirstKeyStartProps(getPrevProps(parent));
				fixFlowSeqItems(fc);
				const sep$1 = fc.end.splice(1, fc.end.length);
				sep$1.push(this.sourceToken);
				const map$2 = {
					type: "block-map",
					offset: fc.offset,
					indent: fc.indent,
					items: [{
						start,
						key: fc,
						sep: sep$1
					}]
				};
				this.onKeyLine = true;
				this.stack[this.stack.length - 1] = map$2;
			} else yield* this.lineEnd(fc);
		}
	}
	flowScalar(type) {
		if (this.onNewLine) {
			let nl = this.source.indexOf("\n") + 1;
			while (nl !== 0) {
				this.onNewLine(this.offset + nl);
				nl = this.source.indexOf("\n", nl) + 1;
			}
		}
		return {
			type,
			offset: this.offset,
			indent: this.indent,
			source: this.source
		};
	}
	startBlockValue(parent) {
		switch (this.type) {
			case "alias":
			case "scalar":
			case "single-quoted-scalar":
			case "double-quoted-scalar": return this.flowScalar(this.type);
			case "block-scalar-header": return {
				type: "block-scalar",
				offset: this.offset,
				indent: this.indent,
				props: [this.sourceToken],
				source: ""
			};
			case "flow-map-start":
			case "flow-seq-start": return {
				type: "flow-collection",
				offset: this.offset,
				indent: this.indent,
				start: this.sourceToken,
				items: [],
				end: []
			};
			case "seq-item-ind": return {
				type: "block-seq",
				offset: this.offset,
				indent: this.indent,
				items: [{ start: [this.sourceToken] }]
			};
			case "explicit-key-ind": {
				this.onKeyLine = true;
				const start = getFirstKeyStartProps(getPrevProps(parent));
				start.push(this.sourceToken);
				return {
					type: "block-map",
					offset: this.offset,
					indent: this.indent,
					items: [{
						start,
						explicitKey: true
					}]
				};
			}
			case "map-value-ind": {
				this.onKeyLine = true;
				const start = getFirstKeyStartProps(getPrevProps(parent));
				return {
					type: "block-map",
					offset: this.offset,
					indent: this.indent,
					items: [{
						start,
						key: null,
						sep: [this.sourceToken]
					}]
				};
			}
		}
		return null;
	}
	atIndentedComment(start, indent) {
		if (this.type !== "comment") return false;
		if (this.indent <= indent) return false;
		return start.every((st) => st.type === "newline" || st.type === "space");
	}
	*documentEnd(docEnd) {
		if (this.type !== "doc-mode") {
			if (docEnd.end) docEnd.end.push(this.sourceToken);
			else docEnd.end = [this.sourceToken];
			if (this.type === "newline") yield* this.pop();
		}
	}
	*lineEnd(token) {
		switch (this.type) {
			case "comma":
			case "doc-start":
			case "doc-end":
			case "flow-seq-end":
			case "flow-map-end":
			case "map-value-ind":
				yield* this.pop();
				yield* this.step();
				break;
			case "newline": this.onKeyLine = false;
			case "space":
			case "comment":
			default:
				if (token.end) token.end.push(this.sourceToken);
				else token.end = [this.sourceToken];
				if (this.type === "newline") yield* this.pop();
		}
	}
};
function parseOptions(options) {
	const prettyErrors = options.prettyErrors !== false;
	return {
		lineCounter: options.lineCounter || prettyErrors && new LineCounter() || null,
		prettyErrors
	};
}
function parseDocument(source, options = {}) {
	const { lineCounter, prettyErrors } = parseOptions(options);
	const parser = new Parser$2(lineCounter?.addNewLine);
	const composer = new Composer(options);
	let doc = null;
	for (const _doc of composer.compose(parser.parse(source), true, source.length)) if (!doc) doc = _doc;
	else if (doc.options.logLevel !== "silent") {
		doc.errors.push(new YAMLParseError(_doc.range.slice(0, 2), "MULTIPLE_DOCS", "Source contains multiple documents; please use YAML.parseAllDocuments()"));
		break;
	}
	if (prettyErrors && lineCounter) {
		doc.errors.forEach(prettifyError(source, lineCounter));
		doc.warnings.forEach(prettifyError(source, lineCounter));
	}
	return doc;
}
function parse$1(src, reviver, options) {
	let _reviver = void 0;
	if (typeof reviver === "function") _reviver = reviver;
	else if (options === void 0 && reviver && typeof reviver === "object") options = reviver;
	const doc = parseDocument(src, options);
	if (!doc) return null;
	doc.warnings.forEach((warning) => warn(doc.options.logLevel, warning));
	if (doc.errors.length > 0) if (doc.options.logLevel !== "silent") throw doc.errors[0];
	else doc.errors = [];
	return doc.toJS(Object.assign({ reviver: _reviver }, options));
}
var util$5;
(function(util$6) {
	util$6.assertEqual = (_) => {};
	function assertIs(_arg) {}
	util$6.assertIs = assertIs;
	function assertNever(_x) {
		throw new Error();
	}
	util$6.assertNever = assertNever;
	util$6.arrayToEnum = (items) => {
		const obj = {};
		for (const item of items) obj[item] = item;
		return obj;
	};
	util$6.getValidEnumValues = (obj) => {
		const validKeys = util$6.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
		const filtered = {};
		for (const k of validKeys) filtered[k] = obj[k];
		return util$6.objectValues(filtered);
	};
	util$6.objectValues = (obj) => {
		return util$6.objectKeys(obj).map(function(e) {
			return obj[e];
		});
	};
	util$6.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
		const keys = [];
		for (const key in object) if (Object.prototype.hasOwnProperty.call(object, key)) keys.push(key);
		return keys;
	};
	util$6.find = (arr, checker) => {
		for (const item of arr) if (checker(item)) return item;
	};
	util$6.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
	function joinValues(array, separator = " | ") {
		return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
	}
	util$6.joinValues = joinValues;
	util$6.jsonStringifyReplacer = (_, value) => {
		if (typeof value === "bigint") return value.toString();
		return value;
	};
})(util$5 || (util$5 = {}));
var objectUtil;
(function(objectUtil$1) {
	objectUtil$1.mergeShapes = (first$1, second) => {
		return {
			...first$1,
			...second
		};
	};
})(objectUtil || (objectUtil = {}));
const ZodParsedType = util$5.arrayToEnum([
	"string",
	"nan",
	"number",
	"integer",
	"float",
	"boolean",
	"date",
	"bigint",
	"symbol",
	"function",
	"undefined",
	"null",
	"array",
	"object",
	"unknown",
	"promise",
	"void",
	"never",
	"map",
	"set"
]);
const getParsedType = (data) => {
	switch (typeof data) {
		case "undefined": return ZodParsedType.undefined;
		case "string": return ZodParsedType.string;
		case "number": return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
		case "boolean": return ZodParsedType.boolean;
		case "function": return ZodParsedType.function;
		case "bigint": return ZodParsedType.bigint;
		case "symbol": return ZodParsedType.symbol;
		case "object":
			if (Array.isArray(data)) return ZodParsedType.array;
			if (data === null) return ZodParsedType.null;
			if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") return ZodParsedType.promise;
			if (typeof Map !== "undefined" && data instanceof Map) return ZodParsedType.map;
			if (typeof Set !== "undefined" && data instanceof Set) return ZodParsedType.set;
			if (typeof Date !== "undefined" && data instanceof Date) return ZodParsedType.date;
			return ZodParsedType.object;
		default: return ZodParsedType.unknown;
	}
};
const ZodIssueCode = util$5.arrayToEnum([
	"invalid_type",
	"invalid_literal",
	"custom",
	"invalid_union",
	"invalid_union_discriminator",
	"invalid_enum_value",
	"unrecognized_keys",
	"invalid_arguments",
	"invalid_return_type",
	"invalid_date",
	"invalid_string",
	"too_small",
	"too_big",
	"invalid_intersection_types",
	"not_multiple_of",
	"not_finite"
]);
var ZodError = class ZodError extends Error {
	get errors() {
		return this.issues;
	}
	constructor(issues) {
		super();
		this.issues = [];
		this.addIssue = (sub) => {
			this.issues = [...this.issues, sub];
		};
		this.addIssues = (subs = []) => {
			this.issues = [...this.issues, ...subs];
		};
		const actualProto = new.target.prototype;
		if (Object.setPrototypeOf) Object.setPrototypeOf(this, actualProto);
		else this.__proto__ = actualProto;
		this.name = "ZodError";
		this.issues = issues;
	}
	format(_mapper) {
		const mapper = _mapper || function(issue) {
			return issue.message;
		};
		const fieldErrors = { _errors: [] };
		const processError = (error) => {
			for (const issue of error.issues) if (issue.code === "invalid_union") issue.unionErrors.map(processError);
			else if (issue.code === "invalid_return_type") processError(issue.returnTypeError);
			else if (issue.code === "invalid_arguments") processError(issue.argumentsError);
			else if (issue.path.length === 0) fieldErrors._errors.push(mapper(issue));
			else {
				let curr = fieldErrors;
				let i = 0;
				while (i < issue.path.length) {
					const el = issue.path[i];
					if (!(i === issue.path.length - 1)) curr[el] = curr[el] || { _errors: [] };
					else {
						curr[el] = curr[el] || { _errors: [] };
						curr[el]._errors.push(mapper(issue));
					}
					curr = curr[el];
					i++;
				}
			}
		};
		processError(this);
		return fieldErrors;
	}
	static assert(value) {
		if (!(value instanceof ZodError)) throw new Error(`Not a ZodError: ${value}`);
	}
	toString() {
		return this.message;
	}
	get message() {
		return JSON.stringify(this.issues, util$5.jsonStringifyReplacer, 2);
	}
	get isEmpty() {
		return this.issues.length === 0;
	}
	flatten(mapper = (issue) => issue.message) {
		const fieldErrors = {};
		const formErrors = [];
		for (const sub of this.issues) if (sub.path.length > 0) {
			const firstEl = sub.path[0];
			fieldErrors[firstEl] = fieldErrors[firstEl] || [];
			fieldErrors[firstEl].push(mapper(sub));
		} else formErrors.push(mapper(sub));
		return {
			formErrors,
			fieldErrors
		};
	}
	get formErrors() {
		return this.flatten();
	}
};
ZodError.create = (issues) => {
	return new ZodError(issues);
};
var errorMap = (issue, _ctx) => {
	let message;
	switch (issue.code) {
		case ZodIssueCode.invalid_type:
			if (issue.received === ZodParsedType.undefined) message = "Required";
			else message = `Expected ${issue.expected}, received ${issue.received}`;
			break;
		case ZodIssueCode.invalid_literal:
			message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util$5.jsonStringifyReplacer)}`;
			break;
		case ZodIssueCode.unrecognized_keys:
			message = `Unrecognized key(s) in object: ${util$5.joinValues(issue.keys, ", ")}`;
			break;
		case ZodIssueCode.invalid_union:
			message = `Invalid input`;
			break;
		case ZodIssueCode.invalid_union_discriminator:
			message = `Invalid discriminator value. Expected ${util$5.joinValues(issue.options)}`;
			break;
		case ZodIssueCode.invalid_enum_value:
			message = `Invalid enum value. Expected ${util$5.joinValues(issue.options)}, received '${issue.received}'`;
			break;
		case ZodIssueCode.invalid_arguments:
			message = `Invalid function arguments`;
			break;
		case ZodIssueCode.invalid_return_type:
			message = `Invalid function return type`;
			break;
		case ZodIssueCode.invalid_date:
			message = `Invalid date`;
			break;
		case ZodIssueCode.invalid_string:
			if (typeof issue.validation === "object") if ("includes" in issue.validation) {
				message = `Invalid input: must include "${issue.validation.includes}"`;
				if (typeof issue.validation.position === "number") message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
			} else if ("startsWith" in issue.validation) message = `Invalid input: must start with "${issue.validation.startsWith}"`;
			else if ("endsWith" in issue.validation) message = `Invalid input: must end with "${issue.validation.endsWith}"`;
			else util$5.assertNever(issue.validation);
			else if (issue.validation !== "regex") message = `Invalid ${issue.validation}`;
			else message = "Invalid";
			break;
		case ZodIssueCode.too_small:
			if (issue.type === "array") message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
			else if (issue.type === "string") message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
			else if (issue.type === "number") message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
			else if (issue.type === "bigint") message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
			else if (issue.type === "date") message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
			else message = "Invalid input";
			break;
		case ZodIssueCode.too_big:
			if (issue.type === "array") message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
			else if (issue.type === "string") message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
			else if (issue.type === "number") message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
			else if (issue.type === "bigint") message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
			else if (issue.type === "date") message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
			else message = "Invalid input";
			break;
		case ZodIssueCode.custom:
			message = `Invalid input`;
			break;
		case ZodIssueCode.invalid_intersection_types:
			message = `Intersection results could not be merged`;
			break;
		case ZodIssueCode.not_multiple_of:
			message = `Number must be a multiple of ${issue.multipleOf}`;
			break;
		case ZodIssueCode.not_finite:
			message = "Number must be finite";
			break;
		default:
			message = _ctx.defaultError;
			util$5.assertNever(issue);
	}
	return { message };
};
var en_default = errorMap;
var overrideErrorMap = en_default;
function getErrorMap() {
	return overrideErrorMap;
}
const makeIssue = (params) => {
	const { data, path: path$1, errorMaps, issueData } = params;
	const fullPath = [...path$1, ...issueData.path || []];
	const fullIssue = {
		...issueData,
		path: fullPath
	};
	if (issueData.message !== void 0) return {
		...issueData,
		path: fullPath,
		message: issueData.message
	};
	let errorMessage = "";
	const maps = errorMaps.filter((m) => !!m).slice().reverse();
	for (const map$2 of maps) errorMessage = map$2(fullIssue, {
		data,
		defaultError: errorMessage
	}).message;
	return {
		...issueData,
		path: fullPath,
		message: errorMessage
	};
};
function addIssueToContext(ctx, issueData) {
	const overrideMap = getErrorMap();
	const issue = makeIssue({
		issueData,
		data: ctx.data,
		path: ctx.path,
		errorMaps: [
			ctx.common.contextualErrorMap,
			ctx.schemaErrorMap,
			overrideMap,
			overrideMap === en_default ? void 0 : en_default
		].filter((x) => !!x)
	});
	ctx.common.issues.push(issue);
}
var ParseStatus = class ParseStatus {
	constructor() {
		this.value = "valid";
	}
	dirty() {
		if (this.value === "valid") this.value = "dirty";
	}
	abort() {
		if (this.value !== "aborted") this.value = "aborted";
	}
	static mergeArray(status, results) {
		const arrayValue = [];
		for (const s of results) {
			if (s.status === "aborted") return INVALID;
			if (s.status === "dirty") status.dirty();
			arrayValue.push(s.value);
		}
		return {
			status: status.value,
			value: arrayValue
		};
	}
	static async mergeObjectAsync(status, pairs$1) {
		const syncPairs = [];
		for (const pair of pairs$1) {
			const key = await pair.key;
			const value = await pair.value;
			syncPairs.push({
				key,
				value
			});
		}
		return ParseStatus.mergeObjectSync(status, syncPairs);
	}
	static mergeObjectSync(status, pairs$1) {
		const finalObject = {};
		for (const pair of pairs$1) {
			const { key, value } = pair;
			if (key.status === "aborted") return INVALID;
			if (value.status === "aborted") return INVALID;
			if (key.status === "dirty") status.dirty();
			if (value.status === "dirty") status.dirty();
			if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) finalObject[key.value] = value.value;
		}
		return {
			status: status.value,
			value: finalObject
		};
	}
};
const INVALID = Object.freeze({ status: "aborted" });
const DIRTY = (value) => ({
	status: "dirty",
	value
});
const OK = (value) => ({
	status: "valid",
	value
});
const isAborted = (x) => x.status === "aborted";
const isDirty = (x) => x.status === "dirty";
const isValid = (x) => x.status === "valid";
const isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;
var errorUtil;
(function(errorUtil$1) {
	errorUtil$1.errToObj = (message) => typeof message === "string" ? { message } : message || {};
	errorUtil$1.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));
var ParseInputLazyPath = class {
	constructor(parent, value, path$1, key) {
		this._cachedPath = [];
		this.parent = parent;
		this.data = value;
		this._path = path$1;
		this._key = key;
	}
	get path() {
		if (!this._cachedPath.length) if (Array.isArray(this._key)) this._cachedPath.push(...this._path, ...this._key);
		else this._cachedPath.push(...this._path, this._key);
		return this._cachedPath;
	}
};
var handleResult = (ctx, result) => {
	if (isValid(result)) return {
		success: true,
		data: result.value
	};
	else {
		if (!ctx.common.issues.length) throw new Error("Validation failed but no issues detected.");
		return {
			success: false,
			get error() {
				if (this._error) return this._error;
				this._error = new ZodError(ctx.common.issues);
				return this._error;
			}
		};
	}
};
function processCreateParams(params) {
	if (!params) return {};
	const { errorMap: errorMap$1, invalid_type_error, required_error, description } = params;
	if (errorMap$1 && (invalid_type_error || required_error)) throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
	if (errorMap$1) return {
		errorMap: errorMap$1,
		description
	};
	const customMap = (iss, ctx) => {
		const { message } = params;
		if (iss.code === "invalid_enum_value") return { message: message ?? ctx.defaultError };
		if (typeof ctx.data === "undefined") return { message: message ?? required_error ?? ctx.defaultError };
		if (iss.code !== "invalid_type") return { message: ctx.defaultError };
		return { message: message ?? invalid_type_error ?? ctx.defaultError };
	};
	return {
		errorMap: customMap,
		description
	};
}
var ZodType = class {
	get description() {
		return this._def.description;
	}
	_getType(input) {
		return getParsedType(input.data);
	}
	_getOrReturnCtx(input, ctx) {
		return ctx || {
			common: input.parent.common,
			data: input.data,
			parsedType: getParsedType(input.data),
			schemaErrorMap: this._def.errorMap,
			path: input.path,
			parent: input.parent
		};
	}
	_processInputParams(input) {
		return {
			status: new ParseStatus(),
			ctx: {
				common: input.parent.common,
				data: input.data,
				parsedType: getParsedType(input.data),
				schemaErrorMap: this._def.errorMap,
				path: input.path,
				parent: input.parent
			}
		};
	}
	_parseSync(input) {
		const result = this._parse(input);
		if (isAsync(result)) throw new Error("Synchronous parse encountered promise.");
		return result;
	}
	_parseAsync(input) {
		const result = this._parse(input);
		return Promise.resolve(result);
	}
	parse(data, params) {
		const result = this.safeParse(data, params);
		if (result.success) return result.data;
		throw result.error;
	}
	safeParse(data, params) {
		const ctx = {
			common: {
				issues: [],
				async: params?.async ?? false,
				contextualErrorMap: params?.errorMap
			},
			path: params?.path || [],
			schemaErrorMap: this._def.errorMap,
			parent: null,
			data,
			parsedType: getParsedType(data)
		};
		return handleResult(ctx, this._parseSync({
			data,
			path: ctx.path,
			parent: ctx
		}));
	}
	"~validate"(data) {
		const ctx = {
			common: {
				issues: [],
				async: !!this["~standard"].async
			},
			path: [],
			schemaErrorMap: this._def.errorMap,
			parent: null,
			data,
			parsedType: getParsedType(data)
		};
		if (!this["~standard"].async) try {
			const result = this._parseSync({
				data,
				path: [],
				parent: ctx
			});
			return isValid(result) ? { value: result.value } : { issues: ctx.common.issues };
		} catch (err) {
			if (err?.message?.toLowerCase()?.includes("encountered")) this["~standard"].async = true;
			ctx.common = {
				issues: [],
				async: true
			};
		}
		return this._parseAsync({
			data,
			path: [],
			parent: ctx
		}).then((result) => isValid(result) ? { value: result.value } : { issues: ctx.common.issues });
	}
	async parseAsync(data, params) {
		const result = await this.safeParseAsync(data, params);
		if (result.success) return result.data;
		throw result.error;
	}
	async safeParseAsync(data, params) {
		const ctx = {
			common: {
				issues: [],
				contextualErrorMap: params?.errorMap,
				async: true
			},
			path: params?.path || [],
			schemaErrorMap: this._def.errorMap,
			parent: null,
			data,
			parsedType: getParsedType(data)
		};
		const maybeAsyncResult = this._parse({
			data,
			path: ctx.path,
			parent: ctx
		});
		return handleResult(ctx, await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult)));
	}
	refine(check, message) {
		const getIssueProperties = (val) => {
			if (typeof message === "string" || typeof message === "undefined") return { message };
			else if (typeof message === "function") return message(val);
			else return message;
		};
		return this._refinement((val, ctx) => {
			const result = check(val);
			const setError = () => ctx.addIssue({
				code: ZodIssueCode.custom,
				...getIssueProperties(val)
			});
			if (typeof Promise !== "undefined" && result instanceof Promise) return result.then((data) => {
				if (!data) {
					setError();
					return false;
				} else return true;
			});
			if (!result) {
				setError();
				return false;
			} else return true;
		});
	}
	refinement(check, refinementData) {
		return this._refinement((val, ctx) => {
			if (!check(val)) {
				ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
				return false;
			} else return true;
		});
	}
	_refinement(refinement) {
		return new ZodEffects({
			schema: this,
			typeName: ZodFirstPartyTypeKind.ZodEffects,
			effect: {
				type: "refinement",
				refinement
			}
		});
	}
	superRefine(refinement) {
		return this._refinement(refinement);
	}
	constructor(def) {
		this.spa = this.safeParseAsync;
		this._def = def;
		this.parse = this.parse.bind(this);
		this.safeParse = this.safeParse.bind(this);
		this.parseAsync = this.parseAsync.bind(this);
		this.safeParseAsync = this.safeParseAsync.bind(this);
		this.spa = this.spa.bind(this);
		this.refine = this.refine.bind(this);
		this.refinement = this.refinement.bind(this);
		this.superRefine = this.superRefine.bind(this);
		this.optional = this.optional.bind(this);
		this.nullable = this.nullable.bind(this);
		this.nullish = this.nullish.bind(this);
		this.array = this.array.bind(this);
		this.promise = this.promise.bind(this);
		this.or = this.or.bind(this);
		this.and = this.and.bind(this);
		this.transform = this.transform.bind(this);
		this.brand = this.brand.bind(this);
		this.default = this.default.bind(this);
		this.catch = this.catch.bind(this);
		this.describe = this.describe.bind(this);
		this.pipe = this.pipe.bind(this);
		this.readonly = this.readonly.bind(this);
		this.isNullable = this.isNullable.bind(this);
		this.isOptional = this.isOptional.bind(this);
		this["~standard"] = {
			version: 1,
			vendor: "zod",
			validate: (data) => this["~validate"](data)
		};
	}
	optional() {
		return ZodOptional.create(this, this._def);
	}
	nullable() {
		return ZodNullable.create(this, this._def);
	}
	nullish() {
		return this.nullable().optional();
	}
	array() {
		return ZodArray.create(this);
	}
	promise() {
		return ZodPromise.create(this, this._def);
	}
	or(option) {
		return ZodUnion.create([this, option], this._def);
	}
	and(incoming) {
		return ZodIntersection.create(this, incoming, this._def);
	}
	transform(transform) {
		return new ZodEffects({
			...processCreateParams(this._def),
			schema: this,
			typeName: ZodFirstPartyTypeKind.ZodEffects,
			effect: {
				type: "transform",
				transform
			}
		});
	}
	default(def) {
		const defaultValueFunc = typeof def === "function" ? def : () => def;
		return new ZodDefault({
			...processCreateParams(this._def),
			innerType: this,
			defaultValue: defaultValueFunc,
			typeName: ZodFirstPartyTypeKind.ZodDefault
		});
	}
	brand() {
		return new ZodBranded({
			typeName: ZodFirstPartyTypeKind.ZodBranded,
			type: this,
			...processCreateParams(this._def)
		});
	}
	catch(def) {
		const catchValueFunc = typeof def === "function" ? def : () => def;
		return new ZodCatch({
			...processCreateParams(this._def),
			innerType: this,
			catchValue: catchValueFunc,
			typeName: ZodFirstPartyTypeKind.ZodCatch
		});
	}
	describe(description) {
		const This = this.constructor;
		return new This({
			...this._def,
			description
		});
	}
	pipe(target) {
		return ZodPipeline.create(this, target);
	}
	readonly() {
		return ZodReadonly.create(this);
	}
	isOptional() {
		return this.safeParse(void 0).success;
	}
	isNullable() {
		return this.safeParse(null).success;
	}
};
var cuidRegex = /^c[^\s-]{8,}$/i;
var cuid2Regex = /^[0-9a-z]+$/;
var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
var nanoidRegex = /^[a-z0-9_-]{21}$/i;
var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
var emojiRegex;
var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
var dateRegex = /* @__PURE__ */ new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
	let secondsRegexSource = `[0-5]\\d`;
	if (args.precision) secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
	else if (args.precision == null) secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
	const secondsQuantifier = args.precision ? "+" : "?";
	return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
	return /* @__PURE__ */ new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
	let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
	const opts = [];
	opts.push(args.local ? `Z?` : `Z`);
	if (args.offset) opts.push(`([+-]\\d{2}:?\\d{2})`);
	regex = `${regex}(${opts.join("|")})`;
	return /* @__PURE__ */ new RegExp(`^${regex}$`);
}
function isValidIP(ip, version) {
	if ((version === "v4" || !version) && ipv4Regex.test(ip)) return true;
	if ((version === "v6" || !version) && ipv6Regex.test(ip)) return true;
	return false;
}
function isValidJWT(jwt, alg) {
	if (!jwtRegex.test(jwt)) return false;
	try {
		const [header] = jwt.split(".");
		if (!header) return false;
		const base64$1 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
		const decoded = JSON.parse(atob(base64$1));
		if (typeof decoded !== "object" || decoded === null) return false;
		if ("typ" in decoded && decoded?.typ !== "JWT") return false;
		if (!decoded.alg) return false;
		if (alg && decoded.alg !== alg) return false;
		return true;
	} catch {
		return false;
	}
}
function isValidCidr(ip, version) {
	if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) return true;
	if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) return true;
	return false;
}
var ZodString = class ZodString extends ZodType {
	_parse(input) {
		if (this._def.coerce) input.data = String(input.data);
		if (this._getType(input) !== ZodParsedType.string) {
			const ctx$1 = this._getOrReturnCtx(input);
			addIssueToContext(ctx$1, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.string,
				received: ctx$1.parsedType
			});
			return INVALID;
		}
		const status = new ParseStatus();
		let ctx = void 0;
		for (const check of this._def.checks) if (check.kind === "min") {
			if (input.data.length < check.value) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_small,
					minimum: check.value,
					type: "string",
					inclusive: true,
					exact: false,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "max") {
			if (input.data.length > check.value) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_big,
					maximum: check.value,
					type: "string",
					inclusive: true,
					exact: false,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "length") {
			const tooBig = input.data.length > check.value;
			const tooSmall = input.data.length < check.value;
			if (tooBig || tooSmall) {
				ctx = this._getOrReturnCtx(input, ctx);
				if (tooBig) addIssueToContext(ctx, {
					code: ZodIssueCode.too_big,
					maximum: check.value,
					type: "string",
					inclusive: true,
					exact: true,
					message: check.message
				});
				else if (tooSmall) addIssueToContext(ctx, {
					code: ZodIssueCode.too_small,
					minimum: check.value,
					type: "string",
					inclusive: true,
					exact: true,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "email") {
			if (!emailRegex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "email",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "emoji") {
			if (!emojiRegex) emojiRegex = new RegExp(_emojiRegex, "u");
			if (!emojiRegex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "emoji",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "uuid") {
			if (!uuidRegex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "uuid",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "nanoid") {
			if (!nanoidRegex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "nanoid",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "cuid") {
			if (!cuidRegex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "cuid",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "cuid2") {
			if (!cuid2Regex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "cuid2",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "ulid") {
			if (!ulidRegex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "ulid",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "url") try {
			new URL(input.data);
		} catch {
			ctx = this._getOrReturnCtx(input, ctx);
			addIssueToContext(ctx, {
				validation: "url",
				code: ZodIssueCode.invalid_string,
				message: check.message
			});
			status.dirty();
		}
		else if (check.kind === "regex") {
			check.regex.lastIndex = 0;
			if (!check.regex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "regex",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "trim") input.data = input.data.trim();
		else if (check.kind === "includes") {
			if (!input.data.includes(check.value, check.position)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.invalid_string,
					validation: {
						includes: check.value,
						position: check.position
					},
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "toLowerCase") input.data = input.data.toLowerCase();
		else if (check.kind === "toUpperCase") input.data = input.data.toUpperCase();
		else if (check.kind === "startsWith") {
			if (!input.data.startsWith(check.value)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.invalid_string,
					validation: { startsWith: check.value },
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "endsWith") {
			if (!input.data.endsWith(check.value)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.invalid_string,
					validation: { endsWith: check.value },
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "datetime") {
			if (!datetimeRegex(check).test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.invalid_string,
					validation: "datetime",
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "date") {
			if (!dateRegex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.invalid_string,
					validation: "date",
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "time") {
			if (!timeRegex(check).test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.invalid_string,
					validation: "time",
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "duration") {
			if (!durationRegex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "duration",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "ip") {
			if (!isValidIP(input.data, check.version)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "ip",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "jwt") {
			if (!isValidJWT(input.data, check.alg)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "jwt",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "cidr") {
			if (!isValidCidr(input.data, check.version)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "cidr",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "base64") {
			if (!base64Regex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "base64",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "base64url") {
			if (!base64urlRegex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "base64url",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else util$5.assertNever(check);
		return {
			status: status.value,
			value: input.data
		};
	}
	_regex(regex, validation, message) {
		return this.refinement((data) => regex.test(data), {
			validation,
			code: ZodIssueCode.invalid_string,
			...errorUtil.errToObj(message)
		});
	}
	_addCheck(check) {
		return new ZodString({
			...this._def,
			checks: [...this._def.checks, check]
		});
	}
	email(message) {
		return this._addCheck({
			kind: "email",
			...errorUtil.errToObj(message)
		});
	}
	url(message) {
		return this._addCheck({
			kind: "url",
			...errorUtil.errToObj(message)
		});
	}
	emoji(message) {
		return this._addCheck({
			kind: "emoji",
			...errorUtil.errToObj(message)
		});
	}
	uuid(message) {
		return this._addCheck({
			kind: "uuid",
			...errorUtil.errToObj(message)
		});
	}
	nanoid(message) {
		return this._addCheck({
			kind: "nanoid",
			...errorUtil.errToObj(message)
		});
	}
	cuid(message) {
		return this._addCheck({
			kind: "cuid",
			...errorUtil.errToObj(message)
		});
	}
	cuid2(message) {
		return this._addCheck({
			kind: "cuid2",
			...errorUtil.errToObj(message)
		});
	}
	ulid(message) {
		return this._addCheck({
			kind: "ulid",
			...errorUtil.errToObj(message)
		});
	}
	base64(message) {
		return this._addCheck({
			kind: "base64",
			...errorUtil.errToObj(message)
		});
	}
	base64url(message) {
		return this._addCheck({
			kind: "base64url",
			...errorUtil.errToObj(message)
		});
	}
	jwt(options) {
		return this._addCheck({
			kind: "jwt",
			...errorUtil.errToObj(options)
		});
	}
	ip(options) {
		return this._addCheck({
			kind: "ip",
			...errorUtil.errToObj(options)
		});
	}
	cidr(options) {
		return this._addCheck({
			kind: "cidr",
			...errorUtil.errToObj(options)
		});
	}
	datetime(options) {
		if (typeof options === "string") return this._addCheck({
			kind: "datetime",
			precision: null,
			offset: false,
			local: false,
			message: options
		});
		return this._addCheck({
			kind: "datetime",
			precision: typeof options?.precision === "undefined" ? null : options?.precision,
			offset: options?.offset ?? false,
			local: options?.local ?? false,
			...errorUtil.errToObj(options?.message)
		});
	}
	date(message) {
		return this._addCheck({
			kind: "date",
			message
		});
	}
	time(options) {
		if (typeof options === "string") return this._addCheck({
			kind: "time",
			precision: null,
			message: options
		});
		return this._addCheck({
			kind: "time",
			precision: typeof options?.precision === "undefined" ? null : options?.precision,
			...errorUtil.errToObj(options?.message)
		});
	}
	duration(message) {
		return this._addCheck({
			kind: "duration",
			...errorUtil.errToObj(message)
		});
	}
	regex(regex, message) {
		return this._addCheck({
			kind: "regex",
			regex,
			...errorUtil.errToObj(message)
		});
	}
	includes(value, options) {
		return this._addCheck({
			kind: "includes",
			value,
			position: options?.position,
			...errorUtil.errToObj(options?.message)
		});
	}
	startsWith(value, message) {
		return this._addCheck({
			kind: "startsWith",
			value,
			...errorUtil.errToObj(message)
		});
	}
	endsWith(value, message) {
		return this._addCheck({
			kind: "endsWith",
			value,
			...errorUtil.errToObj(message)
		});
	}
	min(minLength, message) {
		return this._addCheck({
			kind: "min",
			value: minLength,
			...errorUtil.errToObj(message)
		});
	}
	max(maxLength, message) {
		return this._addCheck({
			kind: "max",
			value: maxLength,
			...errorUtil.errToObj(message)
		});
	}
	length(len, message) {
		return this._addCheck({
			kind: "length",
			value: len,
			...errorUtil.errToObj(message)
		});
	}
	nonempty(message) {
		return this.min(1, errorUtil.errToObj(message));
	}
	trim() {
		return new ZodString({
			...this._def,
			checks: [...this._def.checks, { kind: "trim" }]
		});
	}
	toLowerCase() {
		return new ZodString({
			...this._def,
			checks: [...this._def.checks, { kind: "toLowerCase" }]
		});
	}
	toUpperCase() {
		return new ZodString({
			...this._def,
			checks: [...this._def.checks, { kind: "toUpperCase" }]
		});
	}
	get isDatetime() {
		return !!this._def.checks.find((ch) => ch.kind === "datetime");
	}
	get isDate() {
		return !!this._def.checks.find((ch) => ch.kind === "date");
	}
	get isTime() {
		return !!this._def.checks.find((ch) => ch.kind === "time");
	}
	get isDuration() {
		return !!this._def.checks.find((ch) => ch.kind === "duration");
	}
	get isEmail() {
		return !!this._def.checks.find((ch) => ch.kind === "email");
	}
	get isURL() {
		return !!this._def.checks.find((ch) => ch.kind === "url");
	}
	get isEmoji() {
		return !!this._def.checks.find((ch) => ch.kind === "emoji");
	}
	get isUUID() {
		return !!this._def.checks.find((ch) => ch.kind === "uuid");
	}
	get isNANOID() {
		return !!this._def.checks.find((ch) => ch.kind === "nanoid");
	}
	get isCUID() {
		return !!this._def.checks.find((ch) => ch.kind === "cuid");
	}
	get isCUID2() {
		return !!this._def.checks.find((ch) => ch.kind === "cuid2");
	}
	get isULID() {
		return !!this._def.checks.find((ch) => ch.kind === "ulid");
	}
	get isIP() {
		return !!this._def.checks.find((ch) => ch.kind === "ip");
	}
	get isCIDR() {
		return !!this._def.checks.find((ch) => ch.kind === "cidr");
	}
	get isBase64() {
		return !!this._def.checks.find((ch) => ch.kind === "base64");
	}
	get isBase64url() {
		return !!this._def.checks.find((ch) => ch.kind === "base64url");
	}
	get minLength() {
		let min = null;
		for (const ch of this._def.checks) if (ch.kind === "min") {
			if (min === null || ch.value > min) min = ch.value;
		}
		return min;
	}
	get maxLength() {
		let max = null;
		for (const ch of this._def.checks) if (ch.kind === "max") {
			if (max === null || ch.value < max) max = ch.value;
		}
		return max;
	}
};
ZodString.create = (params) => {
	return new ZodString({
		checks: [],
		typeName: ZodFirstPartyTypeKind.ZodString,
		coerce: params?.coerce ?? false,
		...processCreateParams(params)
	});
};
function floatSafeRemainder(val, step) {
	const valDecCount = (val.toString().split(".")[1] || "").length;
	const stepDecCount = (step.toString().split(".")[1] || "").length;
	const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
	return Number.parseInt(val.toFixed(decCount).replace(".", "")) % Number.parseInt(step.toFixed(decCount).replace(".", "")) / 10 ** decCount;
}
var ZodNumber = class ZodNumber extends ZodType {
	constructor() {
		super(...arguments);
		this.min = this.gte;
		this.max = this.lte;
		this.step = this.multipleOf;
	}
	_parse(input) {
		if (this._def.coerce) input.data = Number(input.data);
		if (this._getType(input) !== ZodParsedType.number) {
			const ctx$1 = this._getOrReturnCtx(input);
			addIssueToContext(ctx$1, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.number,
				received: ctx$1.parsedType
			});
			return INVALID;
		}
		let ctx = void 0;
		const status = new ParseStatus();
		for (const check of this._def.checks) if (check.kind === "int") {
			if (!util$5.isInteger(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.invalid_type,
					expected: "integer",
					received: "float",
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "min") {
			if (check.inclusive ? input.data < check.value : input.data <= check.value) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_small,
					minimum: check.value,
					type: "number",
					inclusive: check.inclusive,
					exact: false,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "max") {
			if (check.inclusive ? input.data > check.value : input.data >= check.value) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_big,
					maximum: check.value,
					type: "number",
					inclusive: check.inclusive,
					exact: false,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "multipleOf") {
			if (floatSafeRemainder(input.data, check.value) !== 0) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.not_multiple_of,
					multipleOf: check.value,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "finite") {
			if (!Number.isFinite(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.not_finite,
					message: check.message
				});
				status.dirty();
			}
		} else util$5.assertNever(check);
		return {
			status: status.value,
			value: input.data
		};
	}
	gte(value, message) {
		return this.setLimit("min", value, true, errorUtil.toString(message));
	}
	gt(value, message) {
		return this.setLimit("min", value, false, errorUtil.toString(message));
	}
	lte(value, message) {
		return this.setLimit("max", value, true, errorUtil.toString(message));
	}
	lt(value, message) {
		return this.setLimit("max", value, false, errorUtil.toString(message));
	}
	setLimit(kind, value, inclusive, message) {
		return new ZodNumber({
			...this._def,
			checks: [...this._def.checks, {
				kind,
				value,
				inclusive,
				message: errorUtil.toString(message)
			}]
		});
	}
	_addCheck(check) {
		return new ZodNumber({
			...this._def,
			checks: [...this._def.checks, check]
		});
	}
	int(message) {
		return this._addCheck({
			kind: "int",
			message: errorUtil.toString(message)
		});
	}
	positive(message) {
		return this._addCheck({
			kind: "min",
			value: 0,
			inclusive: false,
			message: errorUtil.toString(message)
		});
	}
	negative(message) {
		return this._addCheck({
			kind: "max",
			value: 0,
			inclusive: false,
			message: errorUtil.toString(message)
		});
	}
	nonpositive(message) {
		return this._addCheck({
			kind: "max",
			value: 0,
			inclusive: true,
			message: errorUtil.toString(message)
		});
	}
	nonnegative(message) {
		return this._addCheck({
			kind: "min",
			value: 0,
			inclusive: true,
			message: errorUtil.toString(message)
		});
	}
	multipleOf(value, message) {
		return this._addCheck({
			kind: "multipleOf",
			value,
			message: errorUtil.toString(message)
		});
	}
	finite(message) {
		return this._addCheck({
			kind: "finite",
			message: errorUtil.toString(message)
		});
	}
	safe(message) {
		return this._addCheck({
			kind: "min",
			inclusive: true,
			value: Number.MIN_SAFE_INTEGER,
			message: errorUtil.toString(message)
		})._addCheck({
			kind: "max",
			inclusive: true,
			value: Number.MAX_SAFE_INTEGER,
			message: errorUtil.toString(message)
		});
	}
	get minValue() {
		let min = null;
		for (const ch of this._def.checks) if (ch.kind === "min") {
			if (min === null || ch.value > min) min = ch.value;
		}
		return min;
	}
	get maxValue() {
		let max = null;
		for (const ch of this._def.checks) if (ch.kind === "max") {
			if (max === null || ch.value < max) max = ch.value;
		}
		return max;
	}
	get isInt() {
		return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util$5.isInteger(ch.value));
	}
	get isFinite() {
		let max = null;
		let min = null;
		for (const ch of this._def.checks) if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") return true;
		else if (ch.kind === "min") {
			if (min === null || ch.value > min) min = ch.value;
		} else if (ch.kind === "max") {
			if (max === null || ch.value < max) max = ch.value;
		}
		return Number.isFinite(min) && Number.isFinite(max);
	}
};
ZodNumber.create = (params) => {
	return new ZodNumber({
		checks: [],
		typeName: ZodFirstPartyTypeKind.ZodNumber,
		coerce: params?.coerce || false,
		...processCreateParams(params)
	});
};
var ZodBigInt = class ZodBigInt extends ZodType {
	constructor() {
		super(...arguments);
		this.min = this.gte;
		this.max = this.lte;
	}
	_parse(input) {
		if (this._def.coerce) try {
			input.data = BigInt(input.data);
		} catch {
			return this._getInvalidInput(input);
		}
		if (this._getType(input) !== ZodParsedType.bigint) return this._getInvalidInput(input);
		let ctx = void 0;
		const status = new ParseStatus();
		for (const check of this._def.checks) if (check.kind === "min") {
			if (check.inclusive ? input.data < check.value : input.data <= check.value) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_small,
					type: "bigint",
					minimum: check.value,
					inclusive: check.inclusive,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "max") {
			if (check.inclusive ? input.data > check.value : input.data >= check.value) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_big,
					type: "bigint",
					maximum: check.value,
					inclusive: check.inclusive,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "multipleOf") {
			if (input.data % check.value !== BigInt(0)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.not_multiple_of,
					multipleOf: check.value,
					message: check.message
				});
				status.dirty();
			}
		} else util$5.assertNever(check);
		return {
			status: status.value,
			value: input.data
		};
	}
	_getInvalidInput(input) {
		const ctx = this._getOrReturnCtx(input);
		addIssueToContext(ctx, {
			code: ZodIssueCode.invalid_type,
			expected: ZodParsedType.bigint,
			received: ctx.parsedType
		});
		return INVALID;
	}
	gte(value, message) {
		return this.setLimit("min", value, true, errorUtil.toString(message));
	}
	gt(value, message) {
		return this.setLimit("min", value, false, errorUtil.toString(message));
	}
	lte(value, message) {
		return this.setLimit("max", value, true, errorUtil.toString(message));
	}
	lt(value, message) {
		return this.setLimit("max", value, false, errorUtil.toString(message));
	}
	setLimit(kind, value, inclusive, message) {
		return new ZodBigInt({
			...this._def,
			checks: [...this._def.checks, {
				kind,
				value,
				inclusive,
				message: errorUtil.toString(message)
			}]
		});
	}
	_addCheck(check) {
		return new ZodBigInt({
			...this._def,
			checks: [...this._def.checks, check]
		});
	}
	positive(message) {
		return this._addCheck({
			kind: "min",
			value: BigInt(0),
			inclusive: false,
			message: errorUtil.toString(message)
		});
	}
	negative(message) {
		return this._addCheck({
			kind: "max",
			value: BigInt(0),
			inclusive: false,
			message: errorUtil.toString(message)
		});
	}
	nonpositive(message) {
		return this._addCheck({
			kind: "max",
			value: BigInt(0),
			inclusive: true,
			message: errorUtil.toString(message)
		});
	}
	nonnegative(message) {
		return this._addCheck({
			kind: "min",
			value: BigInt(0),
			inclusive: true,
			message: errorUtil.toString(message)
		});
	}
	multipleOf(value, message) {
		return this._addCheck({
			kind: "multipleOf",
			value,
			message: errorUtil.toString(message)
		});
	}
	get minValue() {
		let min = null;
		for (const ch of this._def.checks) if (ch.kind === "min") {
			if (min === null || ch.value > min) min = ch.value;
		}
		return min;
	}
	get maxValue() {
		let max = null;
		for (const ch of this._def.checks) if (ch.kind === "max") {
			if (max === null || ch.value < max) max = ch.value;
		}
		return max;
	}
};
ZodBigInt.create = (params) => {
	return new ZodBigInt({
		checks: [],
		typeName: ZodFirstPartyTypeKind.ZodBigInt,
		coerce: params?.coerce ?? false,
		...processCreateParams(params)
	});
};
var ZodBoolean = class extends ZodType {
	_parse(input) {
		if (this._def.coerce) input.data = Boolean(input.data);
		if (this._getType(input) !== ZodParsedType.boolean) {
			const ctx = this._getOrReturnCtx(input);
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.boolean,
				received: ctx.parsedType
			});
			return INVALID;
		}
		return OK(input.data);
	}
};
ZodBoolean.create = (params) => {
	return new ZodBoolean({
		typeName: ZodFirstPartyTypeKind.ZodBoolean,
		coerce: params?.coerce || false,
		...processCreateParams(params)
	});
};
var ZodDate = class ZodDate extends ZodType {
	_parse(input) {
		if (this._def.coerce) input.data = new Date(input.data);
		if (this._getType(input) !== ZodParsedType.date) {
			const ctx$1 = this._getOrReturnCtx(input);
			addIssueToContext(ctx$1, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.date,
				received: ctx$1.parsedType
			});
			return INVALID;
		}
		if (Number.isNaN(input.data.getTime())) {
			addIssueToContext(this._getOrReturnCtx(input), { code: ZodIssueCode.invalid_date });
			return INVALID;
		}
		const status = new ParseStatus();
		let ctx = void 0;
		for (const check of this._def.checks) if (check.kind === "min") {
			if (input.data.getTime() < check.value) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_small,
					message: check.message,
					inclusive: true,
					exact: false,
					minimum: check.value,
					type: "date"
				});
				status.dirty();
			}
		} else if (check.kind === "max") {
			if (input.data.getTime() > check.value) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_big,
					message: check.message,
					inclusive: true,
					exact: false,
					maximum: check.value,
					type: "date"
				});
				status.dirty();
			}
		} else util$5.assertNever(check);
		return {
			status: status.value,
			value: new Date(input.data.getTime())
		};
	}
	_addCheck(check) {
		return new ZodDate({
			...this._def,
			checks: [...this._def.checks, check]
		});
	}
	min(minDate, message) {
		return this._addCheck({
			kind: "min",
			value: minDate.getTime(),
			message: errorUtil.toString(message)
		});
	}
	max(maxDate, message) {
		return this._addCheck({
			kind: "max",
			value: maxDate.getTime(),
			message: errorUtil.toString(message)
		});
	}
	get minDate() {
		let min = null;
		for (const ch of this._def.checks) if (ch.kind === "min") {
			if (min === null || ch.value > min) min = ch.value;
		}
		return min != null ? new Date(min) : null;
	}
	get maxDate() {
		let max = null;
		for (const ch of this._def.checks) if (ch.kind === "max") {
			if (max === null || ch.value < max) max = ch.value;
		}
		return max != null ? new Date(max) : null;
	}
};
ZodDate.create = (params) => {
	return new ZodDate({
		checks: [],
		coerce: params?.coerce || false,
		typeName: ZodFirstPartyTypeKind.ZodDate,
		...processCreateParams(params)
	});
};
var ZodSymbol = class extends ZodType {
	_parse(input) {
		if (this._getType(input) !== ZodParsedType.symbol) {
			const ctx = this._getOrReturnCtx(input);
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.symbol,
				received: ctx.parsedType
			});
			return INVALID;
		}
		return OK(input.data);
	}
};
ZodSymbol.create = (params) => {
	return new ZodSymbol({
		typeName: ZodFirstPartyTypeKind.ZodSymbol,
		...processCreateParams(params)
	});
};
var ZodUndefined = class extends ZodType {
	_parse(input) {
		if (this._getType(input) !== ZodParsedType.undefined) {
			const ctx = this._getOrReturnCtx(input);
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.undefined,
				received: ctx.parsedType
			});
			return INVALID;
		}
		return OK(input.data);
	}
};
ZodUndefined.create = (params) => {
	return new ZodUndefined({
		typeName: ZodFirstPartyTypeKind.ZodUndefined,
		...processCreateParams(params)
	});
};
var ZodNull = class extends ZodType {
	_parse(input) {
		if (this._getType(input) !== ZodParsedType.null) {
			const ctx = this._getOrReturnCtx(input);
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.null,
				received: ctx.parsedType
			});
			return INVALID;
		}
		return OK(input.data);
	}
};
ZodNull.create = (params) => {
	return new ZodNull({
		typeName: ZodFirstPartyTypeKind.ZodNull,
		...processCreateParams(params)
	});
};
var ZodAny = class extends ZodType {
	constructor() {
		super(...arguments);
		this._any = true;
	}
	_parse(input) {
		return OK(input.data);
	}
};
ZodAny.create = (params) => {
	return new ZodAny({
		typeName: ZodFirstPartyTypeKind.ZodAny,
		...processCreateParams(params)
	});
};
var ZodUnknown = class extends ZodType {
	constructor() {
		super(...arguments);
		this._unknown = true;
	}
	_parse(input) {
		return OK(input.data);
	}
};
ZodUnknown.create = (params) => {
	return new ZodUnknown({
		typeName: ZodFirstPartyTypeKind.ZodUnknown,
		...processCreateParams(params)
	});
};
var ZodNever = class extends ZodType {
	_parse(input) {
		const ctx = this._getOrReturnCtx(input);
		addIssueToContext(ctx, {
			code: ZodIssueCode.invalid_type,
			expected: ZodParsedType.never,
			received: ctx.parsedType
		});
		return INVALID;
	}
};
ZodNever.create = (params) => {
	return new ZodNever({
		typeName: ZodFirstPartyTypeKind.ZodNever,
		...processCreateParams(params)
	});
};
var ZodVoid = class extends ZodType {
	_parse(input) {
		if (this._getType(input) !== ZodParsedType.undefined) {
			const ctx = this._getOrReturnCtx(input);
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.void,
				received: ctx.parsedType
			});
			return INVALID;
		}
		return OK(input.data);
	}
};
ZodVoid.create = (params) => {
	return new ZodVoid({
		typeName: ZodFirstPartyTypeKind.ZodVoid,
		...processCreateParams(params)
	});
};
var ZodArray = class ZodArray extends ZodType {
	_parse(input) {
		const { ctx, status } = this._processInputParams(input);
		const def = this._def;
		if (ctx.parsedType !== ZodParsedType.array) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.array,
				received: ctx.parsedType
			});
			return INVALID;
		}
		if (def.exactLength !== null) {
			const tooBig = ctx.data.length > def.exactLength.value;
			const tooSmall = ctx.data.length < def.exactLength.value;
			if (tooBig || tooSmall) {
				addIssueToContext(ctx, {
					code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
					minimum: tooSmall ? def.exactLength.value : void 0,
					maximum: tooBig ? def.exactLength.value : void 0,
					type: "array",
					inclusive: true,
					exact: true,
					message: def.exactLength.message
				});
				status.dirty();
			}
		}
		if (def.minLength !== null) {
			if (ctx.data.length < def.minLength.value) {
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_small,
					minimum: def.minLength.value,
					type: "array",
					inclusive: true,
					exact: false,
					message: def.minLength.message
				});
				status.dirty();
			}
		}
		if (def.maxLength !== null) {
			if (ctx.data.length > def.maxLength.value) {
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_big,
					maximum: def.maxLength.value,
					type: "array",
					inclusive: true,
					exact: false,
					message: def.maxLength.message
				});
				status.dirty();
			}
		}
		if (ctx.common.async) return Promise.all([...ctx.data].map((item, i) => {
			return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
		})).then((result$1) => {
			return ParseStatus.mergeArray(status, result$1);
		});
		const result = [...ctx.data].map((item, i) => {
			return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
		});
		return ParseStatus.mergeArray(status, result);
	}
	get element() {
		return this._def.type;
	}
	min(minLength, message) {
		return new ZodArray({
			...this._def,
			minLength: {
				value: minLength,
				message: errorUtil.toString(message)
			}
		});
	}
	max(maxLength, message) {
		return new ZodArray({
			...this._def,
			maxLength: {
				value: maxLength,
				message: errorUtil.toString(message)
			}
		});
	}
	length(len, message) {
		return new ZodArray({
			...this._def,
			exactLength: {
				value: len,
				message: errorUtil.toString(message)
			}
		});
	}
	nonempty(message) {
		return this.min(1, message);
	}
};
ZodArray.create = (schema$3, params) => {
	return new ZodArray({
		type: schema$3,
		minLength: null,
		maxLength: null,
		exactLength: null,
		typeName: ZodFirstPartyTypeKind.ZodArray,
		...processCreateParams(params)
	});
};
function deepPartialify(schema$3) {
	if (schema$3 instanceof ZodObject) {
		const newShape = {};
		for (const key in schema$3.shape) {
			const fieldSchema = schema$3.shape[key];
			newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
		}
		return new ZodObject({
			...schema$3._def,
			shape: () => newShape
		});
	} else if (schema$3 instanceof ZodArray) return new ZodArray({
		...schema$3._def,
		type: deepPartialify(schema$3.element)
	});
	else if (schema$3 instanceof ZodOptional) return ZodOptional.create(deepPartialify(schema$3.unwrap()));
	else if (schema$3 instanceof ZodNullable) return ZodNullable.create(deepPartialify(schema$3.unwrap()));
	else if (schema$3 instanceof ZodTuple) return ZodTuple.create(schema$3.items.map((item) => deepPartialify(item)));
	else return schema$3;
}
var ZodObject = class ZodObject extends ZodType {
	constructor() {
		super(...arguments);
		this._cached = null;
		this.nonstrict = this.passthrough;
		this.augment = this.extend;
	}
	_getCached() {
		if (this._cached !== null) return this._cached;
		const shape = this._def.shape();
		this._cached = {
			shape,
			keys: util$5.objectKeys(shape)
		};
		return this._cached;
	}
	_parse(input) {
		if (this._getType(input) !== ZodParsedType.object) {
			const ctx$1 = this._getOrReturnCtx(input);
			addIssueToContext(ctx$1, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.object,
				received: ctx$1.parsedType
			});
			return INVALID;
		}
		const { status, ctx } = this._processInputParams(input);
		const { shape, keys: shapeKeys } = this._getCached();
		const extraKeys = [];
		if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
			for (const key in ctx.data) if (!shapeKeys.includes(key)) extraKeys.push(key);
		}
		const pairs$1 = [];
		for (const key of shapeKeys) {
			const keyValidator = shape[key];
			const value = ctx.data[key];
			pairs$1.push({
				key: {
					status: "valid",
					value: key
				},
				value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
				alwaysSet: key in ctx.data
			});
		}
		if (this._def.catchall instanceof ZodNever) {
			const unknownKeys = this._def.unknownKeys;
			if (unknownKeys === "passthrough") for (const key of extraKeys) pairs$1.push({
				key: {
					status: "valid",
					value: key
				},
				value: {
					status: "valid",
					value: ctx.data[key]
				}
			});
			else if (unknownKeys === "strict") {
				if (extraKeys.length > 0) {
					addIssueToContext(ctx, {
						code: ZodIssueCode.unrecognized_keys,
						keys: extraKeys
					});
					status.dirty();
				}
			} else if (unknownKeys === "strip") {} else throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
		} else {
			const catchall = this._def.catchall;
			for (const key of extraKeys) {
				const value = ctx.data[key];
				pairs$1.push({
					key: {
						status: "valid",
						value: key
					},
					value: catchall._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
					alwaysSet: key in ctx.data
				});
			}
		}
		if (ctx.common.async) return Promise.resolve().then(async () => {
			const syncPairs = [];
			for (const pair of pairs$1) {
				const key = await pair.key;
				const value = await pair.value;
				syncPairs.push({
					key,
					value,
					alwaysSet: pair.alwaysSet
				});
			}
			return syncPairs;
		}).then((syncPairs) => {
			return ParseStatus.mergeObjectSync(status, syncPairs);
		});
		else return ParseStatus.mergeObjectSync(status, pairs$1);
	}
	get shape() {
		return this._def.shape();
	}
	strict(message) {
		errorUtil.errToObj;
		return new ZodObject({
			...this._def,
			unknownKeys: "strict",
			...message !== void 0 ? { errorMap: (issue, ctx) => {
				const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
				if (issue.code === "unrecognized_keys") return { message: errorUtil.errToObj(message).message ?? defaultError };
				return { message: defaultError };
			} } : {}
		});
	}
	strip() {
		return new ZodObject({
			...this._def,
			unknownKeys: "strip"
		});
	}
	passthrough() {
		return new ZodObject({
			...this._def,
			unknownKeys: "passthrough"
		});
	}
	extend(augmentation) {
		return new ZodObject({
			...this._def,
			shape: () => ({
				...this._def.shape(),
				...augmentation
			})
		});
	}
	merge(merging) {
		return new ZodObject({
			unknownKeys: merging._def.unknownKeys,
			catchall: merging._def.catchall,
			shape: () => ({
				...this._def.shape(),
				...merging._def.shape()
			}),
			typeName: ZodFirstPartyTypeKind.ZodObject
		});
	}
	setKey(key, schema$3) {
		return this.augment({ [key]: schema$3 });
	}
	catchall(index) {
		return new ZodObject({
			...this._def,
			catchall: index
		});
	}
	pick(mask) {
		const shape = {};
		for (const key of util$5.objectKeys(mask)) if (mask[key] && this.shape[key]) shape[key] = this.shape[key];
		return new ZodObject({
			...this._def,
			shape: () => shape
		});
	}
	omit(mask) {
		const shape = {};
		for (const key of util$5.objectKeys(this.shape)) if (!mask[key]) shape[key] = this.shape[key];
		return new ZodObject({
			...this._def,
			shape: () => shape
		});
	}
	deepPartial() {
		return deepPartialify(this);
	}
	partial(mask) {
		const newShape = {};
		for (const key of util$5.objectKeys(this.shape)) {
			const fieldSchema = this.shape[key];
			if (mask && !mask[key]) newShape[key] = fieldSchema;
			else newShape[key] = fieldSchema.optional();
		}
		return new ZodObject({
			...this._def,
			shape: () => newShape
		});
	}
	required(mask) {
		const newShape = {};
		for (const key of util$5.objectKeys(this.shape)) if (mask && !mask[key]) newShape[key] = this.shape[key];
		else {
			let newField = this.shape[key];
			while (newField instanceof ZodOptional) newField = newField._def.innerType;
			newShape[key] = newField;
		}
		return new ZodObject({
			...this._def,
			shape: () => newShape
		});
	}
	keyof() {
		return createZodEnum(util$5.objectKeys(this.shape));
	}
};
ZodObject.create = (shape, params) => {
	return new ZodObject({
		shape: () => shape,
		unknownKeys: "strip",
		catchall: ZodNever.create(),
		typeName: ZodFirstPartyTypeKind.ZodObject,
		...processCreateParams(params)
	});
};
ZodObject.strictCreate = (shape, params) => {
	return new ZodObject({
		shape: () => shape,
		unknownKeys: "strict",
		catchall: ZodNever.create(),
		typeName: ZodFirstPartyTypeKind.ZodObject,
		...processCreateParams(params)
	});
};
ZodObject.lazycreate = (shape, params) => {
	return new ZodObject({
		shape,
		unknownKeys: "strip",
		catchall: ZodNever.create(),
		typeName: ZodFirstPartyTypeKind.ZodObject,
		...processCreateParams(params)
	});
};
var ZodUnion = class extends ZodType {
	_parse(input) {
		const { ctx } = this._processInputParams(input);
		const options = this._def.options;
		function handleResults(results) {
			for (const result of results) if (result.result.status === "valid") return result.result;
			for (const result of results) if (result.result.status === "dirty") {
				ctx.common.issues.push(...result.ctx.common.issues);
				return result.result;
			}
			const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_union,
				unionErrors
			});
			return INVALID;
		}
		if (ctx.common.async) return Promise.all(options.map(async (option) => {
			const childCtx = {
				...ctx,
				common: {
					...ctx.common,
					issues: []
				},
				parent: null
			};
			return {
				result: await option._parseAsync({
					data: ctx.data,
					path: ctx.path,
					parent: childCtx
				}),
				ctx: childCtx
			};
		})).then(handleResults);
		else {
			let dirty = void 0;
			const issues = [];
			for (const option of options) {
				const childCtx = {
					...ctx,
					common: {
						...ctx.common,
						issues: []
					},
					parent: null
				};
				const result = option._parseSync({
					data: ctx.data,
					path: ctx.path,
					parent: childCtx
				});
				if (result.status === "valid") return result;
				else if (result.status === "dirty" && !dirty) dirty = {
					result,
					ctx: childCtx
				};
				if (childCtx.common.issues.length) issues.push(childCtx.common.issues);
			}
			if (dirty) {
				ctx.common.issues.push(...dirty.ctx.common.issues);
				return dirty.result;
			}
			const unionErrors = issues.map((issues$1) => new ZodError(issues$1));
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_union,
				unionErrors
			});
			return INVALID;
		}
	}
	get options() {
		return this._def.options;
	}
};
ZodUnion.create = (types, params) => {
	return new ZodUnion({
		options: types,
		typeName: ZodFirstPartyTypeKind.ZodUnion,
		...processCreateParams(params)
	});
};
var getDiscriminator = (type) => {
	if (type instanceof ZodLazy) return getDiscriminator(type.schema);
	else if (type instanceof ZodEffects) return getDiscriminator(type.innerType());
	else if (type instanceof ZodLiteral) return [type.value];
	else if (type instanceof ZodEnum) return type.options;
	else if (type instanceof ZodNativeEnum) return util$5.objectValues(type.enum);
	else if (type instanceof ZodDefault) return getDiscriminator(type._def.innerType);
	else if (type instanceof ZodUndefined) return [void 0];
	else if (type instanceof ZodNull) return [null];
	else if (type instanceof ZodOptional) return [void 0, ...getDiscriminator(type.unwrap())];
	else if (type instanceof ZodNullable) return [null, ...getDiscriminator(type.unwrap())];
	else if (type instanceof ZodBranded) return getDiscriminator(type.unwrap());
	else if (type instanceof ZodReadonly) return getDiscriminator(type.unwrap());
	else if (type instanceof ZodCatch) return getDiscriminator(type._def.innerType);
	else return [];
};
var ZodDiscriminatedUnion = class ZodDiscriminatedUnion extends ZodType {
	_parse(input) {
		const { ctx } = this._processInputParams(input);
		if (ctx.parsedType !== ZodParsedType.object) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.object,
				received: ctx.parsedType
			});
			return INVALID;
		}
		const discriminator = this.discriminator;
		const discriminatorValue = ctx.data[discriminator];
		const option = this.optionsMap.get(discriminatorValue);
		if (!option) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_union_discriminator,
				options: Array.from(this.optionsMap.keys()),
				path: [discriminator]
			});
			return INVALID;
		}
		if (ctx.common.async) return option._parseAsync({
			data: ctx.data,
			path: ctx.path,
			parent: ctx
		});
		else return option._parseSync({
			data: ctx.data,
			path: ctx.path,
			parent: ctx
		});
	}
	get discriminator() {
		return this._def.discriminator;
	}
	get options() {
		return this._def.options;
	}
	get optionsMap() {
		return this._def.optionsMap;
	}
	static create(discriminator, options, params) {
		const optionsMap = /* @__PURE__ */ new Map();
		for (const type of options) {
			const discriminatorValues = getDiscriminator(type.shape[discriminator]);
			if (!discriminatorValues.length) throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
			for (const value of discriminatorValues) {
				if (optionsMap.has(value)) throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
				optionsMap.set(value, type);
			}
		}
		return new ZodDiscriminatedUnion({
			typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
			discriminator,
			options,
			optionsMap,
			...processCreateParams(params)
		});
	}
};
function mergeValues(a, b) {
	const aType = getParsedType(a);
	const bType = getParsedType(b);
	if (a === b) return {
		valid: true,
		data: a
	};
	else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
		const bKeys = util$5.objectKeys(b);
		const sharedKeys = util$5.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
		const newObj = {
			...a,
			...b
		};
		for (const key of sharedKeys) {
			const sharedValue = mergeValues(a[key], b[key]);
			if (!sharedValue.valid) return { valid: false };
			newObj[key] = sharedValue.data;
		}
		return {
			valid: true,
			data: newObj
		};
	} else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
		if (a.length !== b.length) return { valid: false };
		const newArray = [];
		for (let index = 0; index < a.length; index++) {
			const itemA = a[index];
			const itemB = b[index];
			const sharedValue = mergeValues(itemA, itemB);
			if (!sharedValue.valid) return { valid: false };
			newArray.push(sharedValue.data);
		}
		return {
			valid: true,
			data: newArray
		};
	} else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) return {
		valid: true,
		data: a
	};
	else return { valid: false };
}
var ZodIntersection = class extends ZodType {
	_parse(input) {
		const { status, ctx } = this._processInputParams(input);
		const handleParsed = (parsedLeft, parsedRight) => {
			if (isAborted(parsedLeft) || isAborted(parsedRight)) return INVALID;
			const merged = mergeValues(parsedLeft.value, parsedRight.value);
			if (!merged.valid) {
				addIssueToContext(ctx, { code: ZodIssueCode.invalid_intersection_types });
				return INVALID;
			}
			if (isDirty(parsedLeft) || isDirty(parsedRight)) status.dirty();
			return {
				status: status.value,
				value: merged.data
			};
		};
		if (ctx.common.async) return Promise.all([this._def.left._parseAsync({
			data: ctx.data,
			path: ctx.path,
			parent: ctx
		}), this._def.right._parseAsync({
			data: ctx.data,
			path: ctx.path,
			parent: ctx
		})]).then(([left, right]) => handleParsed(left, right));
		else return handleParsed(this._def.left._parseSync({
			data: ctx.data,
			path: ctx.path,
			parent: ctx
		}), this._def.right._parseSync({
			data: ctx.data,
			path: ctx.path,
			parent: ctx
		}));
	}
};
ZodIntersection.create = (left, right, params) => {
	return new ZodIntersection({
		left,
		right,
		typeName: ZodFirstPartyTypeKind.ZodIntersection,
		...processCreateParams(params)
	});
};
var ZodTuple = class ZodTuple extends ZodType {
	_parse(input) {
		const { status, ctx } = this._processInputParams(input);
		if (ctx.parsedType !== ZodParsedType.array) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.array,
				received: ctx.parsedType
			});
			return INVALID;
		}
		if (ctx.data.length < this._def.items.length) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.too_small,
				minimum: this._def.items.length,
				inclusive: true,
				exact: false,
				type: "array"
			});
			return INVALID;
		}
		if (!this._def.rest && ctx.data.length > this._def.items.length) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.too_big,
				maximum: this._def.items.length,
				inclusive: true,
				exact: false,
				type: "array"
			});
			status.dirty();
		}
		const items = [...ctx.data].map((item, itemIndex) => {
			const schema$3 = this._def.items[itemIndex] || this._def.rest;
			if (!schema$3) return null;
			return schema$3._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
		}).filter((x) => !!x);
		if (ctx.common.async) return Promise.all(items).then((results) => {
			return ParseStatus.mergeArray(status, results);
		});
		else return ParseStatus.mergeArray(status, items);
	}
	get items() {
		return this._def.items;
	}
	rest(rest) {
		return new ZodTuple({
			...this._def,
			rest
		});
	}
};
ZodTuple.create = (schemas$1, params) => {
	if (!Array.isArray(schemas$1)) throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
	return new ZodTuple({
		items: schemas$1,
		typeName: ZodFirstPartyTypeKind.ZodTuple,
		rest: null,
		...processCreateParams(params)
	});
};
var ZodRecord = class ZodRecord extends ZodType {
	get keySchema() {
		return this._def.keyType;
	}
	get valueSchema() {
		return this._def.valueType;
	}
	_parse(input) {
		const { status, ctx } = this._processInputParams(input);
		if (ctx.parsedType !== ZodParsedType.object) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.object,
				received: ctx.parsedType
			});
			return INVALID;
		}
		const pairs$1 = [];
		const keyType = this._def.keyType;
		const valueType = this._def.valueType;
		for (const key in ctx.data) pairs$1.push({
			key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
			value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
			alwaysSet: key in ctx.data
		});
		if (ctx.common.async) return ParseStatus.mergeObjectAsync(status, pairs$1);
		else return ParseStatus.mergeObjectSync(status, pairs$1);
	}
	get element() {
		return this._def.valueType;
	}
	static create(first$1, second, third) {
		if (second instanceof ZodType) return new ZodRecord({
			keyType: first$1,
			valueType: second,
			typeName: ZodFirstPartyTypeKind.ZodRecord,
			...processCreateParams(third)
		});
		return new ZodRecord({
			keyType: ZodString.create(),
			valueType: first$1,
			typeName: ZodFirstPartyTypeKind.ZodRecord,
			...processCreateParams(second)
		});
	}
};
var ZodMap = class extends ZodType {
	get keySchema() {
		return this._def.keyType;
	}
	get valueSchema() {
		return this._def.valueType;
	}
	_parse(input) {
		const { status, ctx } = this._processInputParams(input);
		if (ctx.parsedType !== ZodParsedType.map) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.map,
				received: ctx.parsedType
			});
			return INVALID;
		}
		const keyType = this._def.keyType;
		const valueType = this._def.valueType;
		const pairs$1 = [...ctx.data.entries()].map(([key, value], index) => {
			return {
				key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
				value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
			};
		});
		if (ctx.common.async) {
			const finalMap = /* @__PURE__ */ new Map();
			return Promise.resolve().then(async () => {
				for (const pair of pairs$1) {
					const key = await pair.key;
					const value = await pair.value;
					if (key.status === "aborted" || value.status === "aborted") return INVALID;
					if (key.status === "dirty" || value.status === "dirty") status.dirty();
					finalMap.set(key.value, value.value);
				}
				return {
					status: status.value,
					value: finalMap
				};
			});
		} else {
			const finalMap = /* @__PURE__ */ new Map();
			for (const pair of pairs$1) {
				const key = pair.key;
				const value = pair.value;
				if (key.status === "aborted" || value.status === "aborted") return INVALID;
				if (key.status === "dirty" || value.status === "dirty") status.dirty();
				finalMap.set(key.value, value.value);
			}
			return {
				status: status.value,
				value: finalMap
			};
		}
	}
};
ZodMap.create = (keyType, valueType, params) => {
	return new ZodMap({
		valueType,
		keyType,
		typeName: ZodFirstPartyTypeKind.ZodMap,
		...processCreateParams(params)
	});
};
var ZodSet = class ZodSet extends ZodType {
	_parse(input) {
		const { status, ctx } = this._processInputParams(input);
		if (ctx.parsedType !== ZodParsedType.set) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.set,
				received: ctx.parsedType
			});
			return INVALID;
		}
		const def = this._def;
		if (def.minSize !== null) {
			if (ctx.data.size < def.minSize.value) {
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_small,
					minimum: def.minSize.value,
					type: "set",
					inclusive: true,
					exact: false,
					message: def.minSize.message
				});
				status.dirty();
			}
		}
		if (def.maxSize !== null) {
			if (ctx.data.size > def.maxSize.value) {
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_big,
					maximum: def.maxSize.value,
					type: "set",
					inclusive: true,
					exact: false,
					message: def.maxSize.message
				});
				status.dirty();
			}
		}
		const valueType = this._def.valueType;
		function finalizeSet(elements$1) {
			const parsedSet = /* @__PURE__ */ new Set();
			for (const element of elements$1) {
				if (element.status === "aborted") return INVALID;
				if (element.status === "dirty") status.dirty();
				parsedSet.add(element.value);
			}
			return {
				status: status.value,
				value: parsedSet
			};
		}
		const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
		if (ctx.common.async) return Promise.all(elements).then((elements$1) => finalizeSet(elements$1));
		else return finalizeSet(elements);
	}
	min(minSize, message) {
		return new ZodSet({
			...this._def,
			minSize: {
				value: minSize,
				message: errorUtil.toString(message)
			}
		});
	}
	max(maxSize, message) {
		return new ZodSet({
			...this._def,
			maxSize: {
				value: maxSize,
				message: errorUtil.toString(message)
			}
		});
	}
	size(size$1, message) {
		return this.min(size$1, message).max(size$1, message);
	}
	nonempty(message) {
		return this.min(1, message);
	}
};
ZodSet.create = (valueType, params) => {
	return new ZodSet({
		valueType,
		minSize: null,
		maxSize: null,
		typeName: ZodFirstPartyTypeKind.ZodSet,
		...processCreateParams(params)
	});
};
var ZodFunction = class ZodFunction extends ZodType {
	constructor() {
		super(...arguments);
		this.validate = this.implement;
	}
	_parse(input) {
		const { ctx } = this._processInputParams(input);
		if (ctx.parsedType !== ZodParsedType.function) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.function,
				received: ctx.parsedType
			});
			return INVALID;
		}
		function makeArgsIssue(args, error) {
			return makeIssue({
				data: args,
				path: ctx.path,
				errorMaps: [
					ctx.common.contextualErrorMap,
					ctx.schemaErrorMap,
					getErrorMap(),
					en_default
				].filter((x) => !!x),
				issueData: {
					code: ZodIssueCode.invalid_arguments,
					argumentsError: error
				}
			});
		}
		function makeReturnsIssue(returns, error) {
			return makeIssue({
				data: returns,
				path: ctx.path,
				errorMaps: [
					ctx.common.contextualErrorMap,
					ctx.schemaErrorMap,
					getErrorMap(),
					en_default
				].filter((x) => !!x),
				issueData: {
					code: ZodIssueCode.invalid_return_type,
					returnTypeError: error
				}
			});
		}
		const params = { errorMap: ctx.common.contextualErrorMap };
		const fn = ctx.data;
		if (this._def.returns instanceof ZodPromise) {
			const me = this;
			return OK(async function(...args) {
				const error = new ZodError([]);
				const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
					error.addIssue(makeArgsIssue(args, e));
					throw error;
				});
				const result = await Reflect.apply(fn, this, parsedArgs);
				return await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
					error.addIssue(makeReturnsIssue(result, e));
					throw error;
				});
			});
		} else {
			const me = this;
			return OK(function(...args) {
				const parsedArgs = me._def.args.safeParse(args, params);
				if (!parsedArgs.success) throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
				const result = Reflect.apply(fn, this, parsedArgs.data);
				const parsedReturns = me._def.returns.safeParse(result, params);
				if (!parsedReturns.success) throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
				return parsedReturns.data;
			});
		}
	}
	parameters() {
		return this._def.args;
	}
	returnType() {
		return this._def.returns;
	}
	args(...items) {
		return new ZodFunction({
			...this._def,
			args: ZodTuple.create(items).rest(ZodUnknown.create())
		});
	}
	returns(returnType) {
		return new ZodFunction({
			...this._def,
			returns: returnType
		});
	}
	implement(func) {
		return this.parse(func);
	}
	strictImplement(func) {
		return this.parse(func);
	}
	static create(args, returns, params) {
		return new ZodFunction({
			args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
			returns: returns || ZodUnknown.create(),
			typeName: ZodFirstPartyTypeKind.ZodFunction,
			...processCreateParams(params)
		});
	}
};
var ZodLazy = class extends ZodType {
	get schema() {
		return this._def.getter();
	}
	_parse(input) {
		const { ctx } = this._processInputParams(input);
		return this._def.getter()._parse({
			data: ctx.data,
			path: ctx.path,
			parent: ctx
		});
	}
};
ZodLazy.create = (getter, params) => {
	return new ZodLazy({
		getter,
		typeName: ZodFirstPartyTypeKind.ZodLazy,
		...processCreateParams(params)
	});
};
var ZodLiteral = class extends ZodType {
	_parse(input) {
		if (input.data !== this._def.value) {
			const ctx = this._getOrReturnCtx(input);
			addIssueToContext(ctx, {
				received: ctx.data,
				code: ZodIssueCode.invalid_literal,
				expected: this._def.value
			});
			return INVALID;
		}
		return {
			status: "valid",
			value: input.data
		};
	}
	get value() {
		return this._def.value;
	}
};
ZodLiteral.create = (value, params) => {
	return new ZodLiteral({
		value,
		typeName: ZodFirstPartyTypeKind.ZodLiteral,
		...processCreateParams(params)
	});
};
function createZodEnum(values, params) {
	return new ZodEnum({
		values,
		typeName: ZodFirstPartyTypeKind.ZodEnum,
		...processCreateParams(params)
	});
}
var ZodEnum = class ZodEnum extends ZodType {
	_parse(input) {
		if (typeof input.data !== "string") {
			const ctx = this._getOrReturnCtx(input);
			const expectedValues = this._def.values;
			addIssueToContext(ctx, {
				expected: util$5.joinValues(expectedValues),
				received: ctx.parsedType,
				code: ZodIssueCode.invalid_type
			});
			return INVALID;
		}
		if (!this._cache) this._cache = new Set(this._def.values);
		if (!this._cache.has(input.data)) {
			const ctx = this._getOrReturnCtx(input);
			const expectedValues = this._def.values;
			addIssueToContext(ctx, {
				received: ctx.data,
				code: ZodIssueCode.invalid_enum_value,
				options: expectedValues
			});
			return INVALID;
		}
		return OK(input.data);
	}
	get options() {
		return this._def.values;
	}
	get enum() {
		const enumValues = {};
		for (const val of this._def.values) enumValues[val] = val;
		return enumValues;
	}
	get Values() {
		const enumValues = {};
		for (const val of this._def.values) enumValues[val] = val;
		return enumValues;
	}
	get Enum() {
		const enumValues = {};
		for (const val of this._def.values) enumValues[val] = val;
		return enumValues;
	}
	extract(values, newDef = this._def) {
		return ZodEnum.create(values, {
			...this._def,
			...newDef
		});
	}
	exclude(values, newDef = this._def) {
		return ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
			...this._def,
			...newDef
		});
	}
};
ZodEnum.create = createZodEnum;
var ZodNativeEnum = class extends ZodType {
	_parse(input) {
		const nativeEnumValues = util$5.getValidEnumValues(this._def.values);
		const ctx = this._getOrReturnCtx(input);
		if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
			const expectedValues = util$5.objectValues(nativeEnumValues);
			addIssueToContext(ctx, {
				expected: util$5.joinValues(expectedValues),
				received: ctx.parsedType,
				code: ZodIssueCode.invalid_type
			});
			return INVALID;
		}
		if (!this._cache) this._cache = new Set(util$5.getValidEnumValues(this._def.values));
		if (!this._cache.has(input.data)) {
			const expectedValues = util$5.objectValues(nativeEnumValues);
			addIssueToContext(ctx, {
				received: ctx.data,
				code: ZodIssueCode.invalid_enum_value,
				options: expectedValues
			});
			return INVALID;
		}
		return OK(input.data);
	}
	get enum() {
		return this._def.values;
	}
};
ZodNativeEnum.create = (values, params) => {
	return new ZodNativeEnum({
		values,
		typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
		...processCreateParams(params)
	});
};
var ZodPromise = class extends ZodType {
	unwrap() {
		return this._def.type;
	}
	_parse(input) {
		const { ctx } = this._processInputParams(input);
		if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.promise,
				received: ctx.parsedType
			});
			return INVALID;
		}
		return OK((ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data)).then((data) => {
			return this._def.type.parseAsync(data, {
				path: ctx.path,
				errorMap: ctx.common.contextualErrorMap
			});
		}));
	}
};
ZodPromise.create = (schema$3, params) => {
	return new ZodPromise({
		type: schema$3,
		typeName: ZodFirstPartyTypeKind.ZodPromise,
		...processCreateParams(params)
	});
};
var ZodEffects = class extends ZodType {
	innerType() {
		return this._def.schema;
	}
	sourceType() {
		return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
	}
	_parse(input) {
		const { status, ctx } = this._processInputParams(input);
		const effect = this._def.effect || null;
		const checkCtx = {
			addIssue: (arg) => {
				addIssueToContext(ctx, arg);
				if (arg.fatal) status.abort();
				else status.dirty();
			},
			get path() {
				return ctx.path;
			}
		};
		checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
		if (effect.type === "preprocess") {
			const processed = effect.transform(ctx.data, checkCtx);
			if (ctx.common.async) return Promise.resolve(processed).then(async (processed$1) => {
				if (status.value === "aborted") return INVALID;
				const result = await this._def.schema._parseAsync({
					data: processed$1,
					path: ctx.path,
					parent: ctx
				});
				if (result.status === "aborted") return INVALID;
				if (result.status === "dirty") return DIRTY(result.value);
				if (status.value === "dirty") return DIRTY(result.value);
				return result;
			});
			else {
				if (status.value === "aborted") return INVALID;
				const result = this._def.schema._parseSync({
					data: processed,
					path: ctx.path,
					parent: ctx
				});
				if (result.status === "aborted") return INVALID;
				if (result.status === "dirty") return DIRTY(result.value);
				if (status.value === "dirty") return DIRTY(result.value);
				return result;
			}
		}
		if (effect.type === "refinement") {
			const executeRefinement = (acc) => {
				const result = effect.refinement(acc, checkCtx);
				if (ctx.common.async) return Promise.resolve(result);
				if (result instanceof Promise) throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
				return acc;
			};
			if (ctx.common.async === false) {
				const inner = this._def.schema._parseSync({
					data: ctx.data,
					path: ctx.path,
					parent: ctx
				});
				if (inner.status === "aborted") return INVALID;
				if (inner.status === "dirty") status.dirty();
				executeRefinement(inner.value);
				return {
					status: status.value,
					value: inner.value
				};
			} else return this._def.schema._parseAsync({
				data: ctx.data,
				path: ctx.path,
				parent: ctx
			}).then((inner) => {
				if (inner.status === "aborted") return INVALID;
				if (inner.status === "dirty") status.dirty();
				return executeRefinement(inner.value).then(() => {
					return {
						status: status.value,
						value: inner.value
					};
				});
			});
		}
		if (effect.type === "transform") if (ctx.common.async === false) {
			const base$1 = this._def.schema._parseSync({
				data: ctx.data,
				path: ctx.path,
				parent: ctx
			});
			if (!isValid(base$1)) return INVALID;
			const result = effect.transform(base$1.value, checkCtx);
			if (result instanceof Promise) throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
			return {
				status: status.value,
				value: result
			};
		} else return this._def.schema._parseAsync({
			data: ctx.data,
			path: ctx.path,
			parent: ctx
		}).then((base$1) => {
			if (!isValid(base$1)) return INVALID;
			return Promise.resolve(effect.transform(base$1.value, checkCtx)).then((result) => ({
				status: status.value,
				value: result
			}));
		});
		util$5.assertNever(effect);
	}
};
ZodEffects.create = (schema$3, effect, params) => {
	return new ZodEffects({
		schema: schema$3,
		typeName: ZodFirstPartyTypeKind.ZodEffects,
		effect,
		...processCreateParams(params)
	});
};
ZodEffects.createWithPreprocess = (preprocess, schema$3, params) => {
	return new ZodEffects({
		schema: schema$3,
		effect: {
			type: "preprocess",
			transform: preprocess
		},
		typeName: ZodFirstPartyTypeKind.ZodEffects,
		...processCreateParams(params)
	});
};
var ZodOptional = class extends ZodType {
	_parse(input) {
		if (this._getType(input) === ZodParsedType.undefined) return OK(void 0);
		return this._def.innerType._parse(input);
	}
	unwrap() {
		return this._def.innerType;
	}
};
ZodOptional.create = (type, params) => {
	return new ZodOptional({
		innerType: type,
		typeName: ZodFirstPartyTypeKind.ZodOptional,
		...processCreateParams(params)
	});
};
var ZodNullable = class extends ZodType {
	_parse(input) {
		if (this._getType(input) === ZodParsedType.null) return OK(null);
		return this._def.innerType._parse(input);
	}
	unwrap() {
		return this._def.innerType;
	}
};
ZodNullable.create = (type, params) => {
	return new ZodNullable({
		innerType: type,
		typeName: ZodFirstPartyTypeKind.ZodNullable,
		...processCreateParams(params)
	});
};
var ZodDefault = class extends ZodType {
	_parse(input) {
		const { ctx } = this._processInputParams(input);
		let data = ctx.data;
		if (ctx.parsedType === ZodParsedType.undefined) data = this._def.defaultValue();
		return this._def.innerType._parse({
			data,
			path: ctx.path,
			parent: ctx
		});
	}
	removeDefault() {
		return this._def.innerType;
	}
};
ZodDefault.create = (type, params) => {
	return new ZodDefault({
		innerType: type,
		typeName: ZodFirstPartyTypeKind.ZodDefault,
		defaultValue: typeof params.default === "function" ? params.default : () => params.default,
		...processCreateParams(params)
	});
};
var ZodCatch = class extends ZodType {
	_parse(input) {
		const { ctx } = this._processInputParams(input);
		const newCtx = {
			...ctx,
			common: {
				...ctx.common,
				issues: []
			}
		};
		const result = this._def.innerType._parse({
			data: newCtx.data,
			path: newCtx.path,
			parent: { ...newCtx }
		});
		if (isAsync(result)) return result.then((result$1) => {
			return {
				status: "valid",
				value: result$1.status === "valid" ? result$1.value : this._def.catchValue({
					get error() {
						return new ZodError(newCtx.common.issues);
					},
					input: newCtx.data
				})
			};
		});
		else return {
			status: "valid",
			value: result.status === "valid" ? result.value : this._def.catchValue({
				get error() {
					return new ZodError(newCtx.common.issues);
				},
				input: newCtx.data
			})
		};
	}
	removeCatch() {
		return this._def.innerType;
	}
};
ZodCatch.create = (type, params) => {
	return new ZodCatch({
		innerType: type,
		typeName: ZodFirstPartyTypeKind.ZodCatch,
		catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
		...processCreateParams(params)
	});
};
var ZodNaN = class extends ZodType {
	_parse(input) {
		if (this._getType(input) !== ZodParsedType.nan) {
			const ctx = this._getOrReturnCtx(input);
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.nan,
				received: ctx.parsedType
			});
			return INVALID;
		}
		return {
			status: "valid",
			value: input.data
		};
	}
};
ZodNaN.create = (params) => {
	return new ZodNaN({
		typeName: ZodFirstPartyTypeKind.ZodNaN,
		...processCreateParams(params)
	});
};
var ZodBranded = class extends ZodType {
	_parse(input) {
		const { ctx } = this._processInputParams(input);
		const data = ctx.data;
		return this._def.type._parse({
			data,
			path: ctx.path,
			parent: ctx
		});
	}
	unwrap() {
		return this._def.type;
	}
};
var ZodPipeline = class ZodPipeline extends ZodType {
	_parse(input) {
		const { status, ctx } = this._processInputParams(input);
		if (ctx.common.async) {
			const handleAsync = async () => {
				const inResult = await this._def.in._parseAsync({
					data: ctx.data,
					path: ctx.path,
					parent: ctx
				});
				if (inResult.status === "aborted") return INVALID;
				if (inResult.status === "dirty") {
					status.dirty();
					return DIRTY(inResult.value);
				} else return this._def.out._parseAsync({
					data: inResult.value,
					path: ctx.path,
					parent: ctx
				});
			};
			return handleAsync();
		} else {
			const inResult = this._def.in._parseSync({
				data: ctx.data,
				path: ctx.path,
				parent: ctx
			});
			if (inResult.status === "aborted") return INVALID;
			if (inResult.status === "dirty") {
				status.dirty();
				return {
					status: "dirty",
					value: inResult.value
				};
			} else return this._def.out._parseSync({
				data: inResult.value,
				path: ctx.path,
				parent: ctx
			});
		}
	}
	static create(a, b) {
		return new ZodPipeline({
			in: a,
			out: b,
			typeName: ZodFirstPartyTypeKind.ZodPipeline
		});
	}
};
var ZodReadonly = class extends ZodType {
	_parse(input) {
		const result = this._def.innerType._parse(input);
		const freeze = (data) => {
			if (isValid(data)) data.value = Object.freeze(data.value);
			return data;
		};
		return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
	}
	unwrap() {
		return this._def.innerType;
	}
};
ZodReadonly.create = (type, params) => {
	return new ZodReadonly({
		innerType: type,
		typeName: ZodFirstPartyTypeKind.ZodReadonly,
		...processCreateParams(params)
	});
};
ZodObject.lazycreate;
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind$1) {
	ZodFirstPartyTypeKind$1["ZodString"] = "ZodString";
	ZodFirstPartyTypeKind$1["ZodNumber"] = "ZodNumber";
	ZodFirstPartyTypeKind$1["ZodNaN"] = "ZodNaN";
	ZodFirstPartyTypeKind$1["ZodBigInt"] = "ZodBigInt";
	ZodFirstPartyTypeKind$1["ZodBoolean"] = "ZodBoolean";
	ZodFirstPartyTypeKind$1["ZodDate"] = "ZodDate";
	ZodFirstPartyTypeKind$1["ZodSymbol"] = "ZodSymbol";
	ZodFirstPartyTypeKind$1["ZodUndefined"] = "ZodUndefined";
	ZodFirstPartyTypeKind$1["ZodNull"] = "ZodNull";
	ZodFirstPartyTypeKind$1["ZodAny"] = "ZodAny";
	ZodFirstPartyTypeKind$1["ZodUnknown"] = "ZodUnknown";
	ZodFirstPartyTypeKind$1["ZodNever"] = "ZodNever";
	ZodFirstPartyTypeKind$1["ZodVoid"] = "ZodVoid";
	ZodFirstPartyTypeKind$1["ZodArray"] = "ZodArray";
	ZodFirstPartyTypeKind$1["ZodObject"] = "ZodObject";
	ZodFirstPartyTypeKind$1["ZodUnion"] = "ZodUnion";
	ZodFirstPartyTypeKind$1["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
	ZodFirstPartyTypeKind$1["ZodIntersection"] = "ZodIntersection";
	ZodFirstPartyTypeKind$1["ZodTuple"] = "ZodTuple";
	ZodFirstPartyTypeKind$1["ZodRecord"] = "ZodRecord";
	ZodFirstPartyTypeKind$1["ZodMap"] = "ZodMap";
	ZodFirstPartyTypeKind$1["ZodSet"] = "ZodSet";
	ZodFirstPartyTypeKind$1["ZodFunction"] = "ZodFunction";
	ZodFirstPartyTypeKind$1["ZodLazy"] = "ZodLazy";
	ZodFirstPartyTypeKind$1["ZodLiteral"] = "ZodLiteral";
	ZodFirstPartyTypeKind$1["ZodEnum"] = "ZodEnum";
	ZodFirstPartyTypeKind$1["ZodEffects"] = "ZodEffects";
	ZodFirstPartyTypeKind$1["ZodNativeEnum"] = "ZodNativeEnum";
	ZodFirstPartyTypeKind$1["ZodOptional"] = "ZodOptional";
	ZodFirstPartyTypeKind$1["ZodNullable"] = "ZodNullable";
	ZodFirstPartyTypeKind$1["ZodDefault"] = "ZodDefault";
	ZodFirstPartyTypeKind$1["ZodCatch"] = "ZodCatch";
	ZodFirstPartyTypeKind$1["ZodPromise"] = "ZodPromise";
	ZodFirstPartyTypeKind$1["ZodBranded"] = "ZodBranded";
	ZodFirstPartyTypeKind$1["ZodPipeline"] = "ZodPipeline";
	ZodFirstPartyTypeKind$1["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
var stringType = ZodString.create;
var numberType = ZodNumber.create;
ZodNaN.create;
ZodBigInt.create;
var booleanType = ZodBoolean.create;
ZodDate.create;
ZodSymbol.create;
ZodUndefined.create;
ZodNull.create;
ZodAny.create;
var unknownType = ZodUnknown.create;
ZodNever.create;
ZodVoid.create;
var arrayType = ZodArray.create;
var objectType$1 = ZodObject.create;
ZodObject.strictCreate;
var unionType = ZodUnion.create;
var discriminatedUnionType = ZodDiscriminatedUnion.create;
ZodIntersection.create;
ZodTuple.create;
var recordType = ZodRecord.create;
ZodMap.create;
ZodSet.create;
ZodFunction.create;
ZodLazy.create;
var literalType = ZodLiteral.create;
var enumType = ZodEnum.create;
ZodNativeEnum.create;
ZodPromise.create;
ZodEffects.create;
ZodOptional.create;
ZodNullable.create;
ZodEffects.createWithPreprocess;
ZodPipeline.create;
var StringResolver = class {
	constructor() {
		this.fullPattern = /^\$\{([^}]*)\}$/;
		this.hasInterpolationPattern = /\$\{[^}]*\}/;
	}
	canResolve(template$1) {
		if (typeof template$1 !== "string") return false;
		return this.fullPattern.test(template$1) || this.hasInterpolationPattern.test(template$1);
	}
	resolve(template$1, context, interpolate) {
		const fullMatch = template$1.match(this.fullPattern);
		if (fullMatch) {
			const path$1 = fullMatch[1].trim();
			if (!path$1) return;
			return this.traversePath(path$1, context);
		}
		return template$1.replace(/\$\{([^}]*)\}/g, (match, path$1) => {
			const trimmedPath = path$1.trim();
			if (!trimmedPath) return "";
			const value = this.traversePath(trimmedPath, context);
			return value !== void 0 ? String(value) : match;
		});
	}
	traversePath(path$1, context) {
		const parts = path$1.split(".").map((p) => p.trim());
		let value = context;
		for (const part of parts) if (value && typeof value === "object" && part in value) value = value[part];
		else return;
		return value;
	}
};
var ArrayResolver = class {
	canResolve(template$1) {
		return Array.isArray(template$1);
	}
	resolve(template$1, context, interpolate) {
		return template$1.map((item) => interpolate(item, context));
	}
};
var ObjectResolver = class {
	canResolve(template$1) {
		return typeof template$1 === "object" && template$1 !== null && !Array.isArray(template$1);
	}
	resolve(template$1, context, interpolate) {
		const resolved = {};
		for (const [key, value] of Object.entries(template$1)) resolved[key] = interpolate(value, context);
		return resolved;
	}
};
var PassthroughResolver = class {
	canResolve(template$1) {
		return true;
	}
	resolve(template$1) {
		return template$1;
	}
};
var Interpolator = class {
	constructor(resolvers) {
		this.resolvers = resolvers || [
			new StringResolver(),
			new ArrayResolver(),
			new ObjectResolver(),
			new PassthroughResolver()
		];
	}
	resolve(template$1, context) {
		for (const resolver of this.resolvers) if (resolver.canResolve(template$1)) return resolver.resolve(template$1, context, (t, c) => this.resolve(t, c));
		return template$1;
	}
};
var globalInterpolator = null;
function getInterpolator() {
	if (!globalInterpolator) globalInterpolator = new Interpolator();
	return globalInterpolator;
}
let Operation = /* @__PURE__ */ function(Operation$1) {
	Operation$1["think"] = "think";
	Operation$1["code"] = "code";
	Operation$1["storage"] = "storage";
	Operation$1["http"] = "http";
	Operation$1["tools"] = "tools";
	Operation$1["scoring"] = "scoring";
	Operation$1["email"] = "email";
	Operation$1["sms"] = "sms";
	Operation$1["form"] = "form";
	Operation$1["page"] = "page";
	Operation$1["html"] = "html";
	Operation$1["pdf"] = "pdf";
	Operation$1["queue"] = "queue";
	Operation$1["docs"] = "docs";
	return Operation$1;
}({});
let AIProvider = /* @__PURE__ */ function(AIProvider$1) {
	AIProvider$1["OpenAI"] = "openai";
	AIProvider$1["Anthropic"] = "anthropic";
	AIProvider$1["Cloudflare"] = "cloudflare";
	AIProvider$1["Custom"] = "custom";
	return AIProvider$1;
}({});
let StorageType = /* @__PURE__ */ function(StorageType$1) {
	StorageType$1["KV"] = "kv";
	StorageType$1["D1"] = "d1";
	StorageType$1["R2"] = "r2";
	return StorageType$1;
}({});
var EnsembleSchema = objectType$1({
	name: stringType().min(1, "Ensemble name is required"),
	description: stringType().optional(),
	state: objectType$1({
		schema: recordType(unknownType()).optional(),
		initial: recordType(unknownType()).optional()
	}).optional(),
	scoring: objectType$1({
		enabled: booleanType(),
		defaultThresholds: objectType$1({
			minimum: numberType().min(0).max(1),
			target: numberType().min(0).max(1).optional(),
			excellent: numberType().min(0).max(1).optional()
		}),
		maxRetries: numberType().positive().optional(),
		backoffStrategy: enumType([
			"linear",
			"exponential",
			"fixed"
		]).optional(),
		initialBackoff: numberType().positive().optional(),
		trackInState: booleanType().optional(),
		criteria: unionType([recordType(stringType()), arrayType(unknownType())]).optional(),
		aggregation: enumType([
			"weighted_average",
			"minimum",
			"geometric_mean"
		]).optional()
	}).optional(),
	trigger: arrayType(discriminatedUnionType("type", [
		objectType$1({
			type: literalType("webhook"),
			path: stringType().min(1).optional(),
			methods: arrayType(enumType([
				"POST",
				"GET",
				"PUT",
				"PATCH",
				"DELETE"
			])).optional(),
			auth: objectType$1({
				type: enumType([
					"bearer",
					"signature",
					"basic"
				]),
				secret: stringType()
			}).optional(),
			public: booleanType().optional(),
			mode: enumType(["trigger", "resume"]).optional(),
			async: booleanType().optional(),
			timeout: numberType().positive().optional()
		}),
		objectType$1({
			type: literalType("mcp"),
			auth: objectType$1({
				type: enumType(["bearer", "oauth"]),
				secret: stringType().optional()
			}).optional(),
			public: booleanType().optional()
		}),
		objectType$1({
			type: literalType("email"),
			addresses: arrayType(stringType().email()).min(1),
			auth: objectType$1({ from: arrayType(stringType()).min(1) }).optional(),
			public: booleanType().optional(),
			reply_with_output: booleanType().optional()
		}),
		objectType$1({
			type: literalType("queue"),
			queue: stringType().min(1),
			batch_size: numberType().positive().optional(),
			max_retries: numberType().nonnegative().optional(),
			max_wait_time: numberType().positive().optional()
		}),
		objectType$1({
			type: literalType("cron"),
			cron: stringType().min(1, "Cron expression is required"),
			timezone: stringType().optional(),
			enabled: booleanType().optional(),
			input: recordType(unknownType()).optional(),
			metadata: recordType(unknownType()).optional()
		})
	])).optional().refine((trigger) => {
		if (!trigger) return true;
		return trigger.every((t) => {
			if (t.type === "queue" || t.type === "cron") return true;
			return t.auth || t.public === true;
		});
	}, { message: "All webhook, MCP, and email triggers must have auth configuration or explicit public: true" }),
	notifications: arrayType(discriminatedUnionType("type", [objectType$1({
		type: literalType("webhook"),
		url: stringType().url(),
		events: arrayType(enumType([
			"execution.started",
			"execution.completed",
			"execution.failed",
			"execution.timeout",
			"agent.completed",
			"state.updated"
		])).min(1),
		secret: stringType().optional(),
		retries: numberType().positive().optional(),
		timeout: numberType().positive().optional()
	}), objectType$1({
		type: literalType("email"),
		to: arrayType(stringType().email()).min(1),
		events: arrayType(enumType([
			"execution.started",
			"execution.completed",
			"execution.failed",
			"execution.timeout",
			"agent.completed",
			"state.updated"
		])).min(1),
		subject: stringType().optional(),
		from: stringType().email().optional()
	})])).optional(),
	flow: arrayType(objectType$1({
		agent: stringType().min(1, "Agent name is required"),
		input: recordType(unknownType()).optional(),
		state: objectType$1({
			use: arrayType(stringType()).optional(),
			set: arrayType(stringType()).optional()
		}).optional(),
		cache: objectType$1({
			ttl: numberType().positive().optional(),
			bypass: booleanType().optional()
		}).optional(),
		scoring: objectType$1({
			evaluator: stringType().min(1),
			thresholds: objectType$1({
				minimum: numberType().min(0).max(1).optional(),
				target: numberType().min(0).max(1).optional(),
				excellent: numberType().min(0).max(1).optional()
			}).optional(),
			criteria: unionType([recordType(stringType()), arrayType(unknownType())]).optional(),
			onFailure: enumType([
				"retry",
				"continue",
				"abort"
			]).optional(),
			retryLimit: numberType().positive().optional(),
			requireImprovement: booleanType().optional(),
			minImprovement: numberType().min(0).max(1).optional()
		}).optional(),
		condition: unknownType().optional()
	})),
	output: recordType(unknownType()).optional()
});
var AgentSchema = objectType$1({
	name: stringType().min(1, "Agent name is required"),
	operation: enumType([
		Operation.think,
		Operation.code,
		Operation.storage,
		Operation.http,
		Operation.tools,
		Operation.scoring,
		Operation.email,
		Operation.sms,
		Operation.form,
		Operation.page,
		Operation.html,
		Operation.pdf,
		Operation.queue,
		Operation.docs
	]),
	description: stringType().optional(),
	config: recordType(unknownType()).optional(),
	schema: objectType$1({
		input: recordType(unknownType()).optional(),
		output: recordType(unknownType()).optional()
	}).optional()
});
var Parser = class {
	static {
		this.interpolator = getInterpolator();
	}
	static parseEnsemble(yamlContent) {
		try {
			const parsed = parse$1(yamlContent);
			if (!parsed) throw new Error("Empty or invalid YAML content");
			return EnsembleSchema.parse(parsed);
		} catch (error) {
			if (error instanceof ZodError) throw new Error(`Ensemble validation failed: ${error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}`);
			throw new Error(`Failed to parse ensemble YAML: ${error instanceof Error ? error.message : "Unknown error"}`);
		}
	}
	static parseAgent(yamlContent) {
		try {
			const parsed = parse$1(yamlContent);
			if (!parsed) throw new Error("Empty or invalid YAML content");
			return AgentSchema.parse(parsed);
		} catch (error) {
			if (error instanceof ZodError) throw new Error(`Agent validation failed: ${error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}`);
			throw new Error(`Failed to parse agent YAML: ${error instanceof Error ? error.message : "Unknown error"}`);
		}
	}
	static resolveInterpolation(template$1, context) {
		return this.interpolator.resolve(template$1, context);
	}
	static parseAgentReference(agentRef) {
		const parts = agentRef.split("@");
		if (parts.length === 1) return { name: parts[0] };
		if (parts.length === 2) return {
			name: parts[0],
			version: parts[1]
		};
		throw new Error(`Invalid agent reference format: ${agentRef}. Expected "name" or "name@version"`);
	}
	static validateAgentReferences(ensemble, availableAgents) {
		const missingAgents = [];
		for (const step of ensemble.flow) {
			const { name } = this.parseAgentReference(step.agent);
			if (!availableAgents.has(name)) missingAgents.push(step.agent);
		}
		if (missingAgents.length > 0) throw new Error(`Ensemble "${ensemble.name}" references missing agents: ${missingAgents.join(", ")}`);
	}
};
var LogLevel;
var init_types = __esmMin((() => {
	LogLevel = /* @__PURE__ */ function(LogLevel$1) {
		LogLevel$1["DEBUG"] = "debug";
		LogLevel$1["INFO"] = "info";
		LogLevel$1["WARN"] = "warn";
		LogLevel$1["ERROR"] = "error";
		return LogLevel$1;
	}({});
}));
function createLogger(config = {}, analyticsEngine) {
	return new ConductorLogger(config, analyticsEngine);
}
var LOG_LEVEL_PRIORITY, ConductorLogger;
var init_logger = __esmMin((() => {
	init_types();
	LOG_LEVEL_PRIORITY = {
		[LogLevel.DEBUG]: 0,
		[LogLevel.INFO]: 1,
		[LogLevel.WARN]: 2,
		[LogLevel.ERROR]: 3
	};
	ConductorLogger = class ConductorLogger {
		constructor(config = {}, analyticsEngine, baseContext = {}) {
			const isDebug = config.debug ?? (typeof process !== "undefined" && {}?.DEBUG === "true" || typeof globalThis !== "undefined" && globalThis.DEBUG === true);
			this.config = {
				level: config.level ?? (isDebug ? LogLevel.DEBUG : LogLevel.INFO),
				serviceName: config.serviceName ?? "conductor",
				environment: config.environment ?? "production",
				debug: isDebug,
				enableAnalytics: config.enableAnalytics ?? true,
				baseContext: config.baseContext ?? {}
			};
			this.baseContext = Object.freeze({
				...this.config.baseContext,
				...baseContext
			});
			this.analyticsEngine = analyticsEngine;
		}
		shouldLog(level) {
			return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.config.level];
		}
		createLogEntry(level, message, context, error) {
			const entry = {
				timestamp: (/* @__PURE__ */ new Date()).toISOString(),
				level,
				message,
				...Object.keys({
					...this.baseContext,
					...context
				}).length > 0 && { context: {
					...this.baseContext,
					...context
				} }
			};
			if (error) entry.error = {
				name: error.name,
				message: error.message,
				stack: error.stack,
				...this.isConductorError(error) && {
					code: error.code,
					details: error.details
				}
			};
			return entry;
		}
		isConductorError(error) {
			return "code" in error && "toJSON" in error;
		}
		log(entry) {
			if (!this.shouldLog(entry.level)) return;
			const logOutput = JSON.stringify(entry);
			switch (entry.level) {
				case LogLevel.DEBUG:
					console.debug(logOutput);
					break;
				case LogLevel.INFO:
					console.info(logOutput);
					break;
				case LogLevel.WARN:
					console.warn(logOutput);
					break;
				case LogLevel.ERROR:
					console.error(logOutput);
					break;
			}
		}
		debug(message, context) {
			const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
			this.log(entry);
		}
		info(message, context) {
			const entry = this.createLogEntry(LogLevel.INFO, message, context);
			this.log(entry);
		}
		warn(message, context) {
			const entry = this.createLogEntry(LogLevel.WARN, message, context);
			this.log(entry);
		}
		error(message, error, context) {
			const entry = this.createLogEntry(LogLevel.ERROR, message, context, error);
			this.log(entry);
		}
		child(context) {
			return new ConductorLogger(this.config, this.analyticsEngine, {
				...this.baseContext,
				...context
			});
		}
		metric(name, data) {
			if (!this.config.enableAnalytics || !this.analyticsEngine) return;
			try {
				this.analyticsEngine.writeDataPoint({
					blobs: data.blobs ?? [],
					doubles: data.doubles ?? [],
					indexes: data.indexes ?? [name]
				});
			} catch (error) {
				this.warn("Failed to write metric", {
					metricName: name,
					error: error instanceof Error ? error.message : "Unknown error"
				});
			}
		}
	};
}));
var init_observability = __esmMin((() => {
	init_logger();
}));
init_observability();
var StateManager = class StateManager {
	constructor(config, existingState, existingLog) {
		this.schema = Object.freeze(config.schema || {});
		this.state = Object.freeze(existingState || { ...config.initial || {} });
		this.accessLog = existingLog || [];
		this.logger = config.logger || createLogger({ serviceName: "state-manager" });
	}
	getStateForAgent(agentName, config) {
		const { use = [], set: set$1 = [] } = config;
		const viewState = {};
		const newLog = [...this.accessLog];
		for (const key of use) if (this.state && key in this.state) {
			viewState[key] = this.state[key];
			newLog.push({
				agent: agentName,
				key,
				operation: "read",
				timestamp: Date.now()
			});
		}
		const pendingUpdates = {};
		const setState = (updates) => {
			for (const [key, value] of Object.entries(updates)) if (set$1.includes(key)) {
				pendingUpdates[key] = value;
				newLog.push({
					agent: agentName,
					key,
					operation: "write",
					timestamp: Date.now()
				});
			} else this.logger.warn("Agent attempted to set undeclared state key", {
				agentName,
				key,
				declaredKeys: set$1
			});
		};
		return {
			context: {
				state: Object.freeze(viewState),
				setState
			},
			getPendingUpdates: () => ({
				updates: pendingUpdates,
				newLog
			})
		};
	}
	applyPendingUpdates(updates, newLog) {
		if (Object.keys(updates).length === 0 && newLog.length === this.accessLog.length) return this;
		const newState = {
			...this.state,
			...updates
		};
		return new StateManager({
			schema: this.schema,
			initial: {},
			logger: this.logger
		}, newState, newLog);
	}
	setStateFromMember(agentName, updates, config) {
		const { set: set$1 = [] } = config;
		const newState = { ...this.state };
		const newLog = [...this.accessLog];
		for (const [key, value] of Object.entries(updates)) if (set$1.includes(key)) {
			newState[key] = value;
			newLog.push({
				agent: agentName,
				key,
				operation: "write",
				timestamp: Date.now()
			});
		} else this.logger.warn("Agent attempted to set undeclared state key", {
			agentName,
			key,
			declaredKeys: set$1
		});
		return new StateManager({
			schema: this.schema,
			initial: {},
			logger: this.logger
		}, newState, newLog);
	}
	getState() {
		return this.state;
	}
	getAccessReport() {
		const allKeys = Object.keys(this.state);
		const usedKeys = /* @__PURE__ */ new Set();
		for (const access of this.accessLog) usedKeys.add(access.key);
		const unusedKeys = allKeys.filter((key) => !usedKeys.has(key));
		const accessPatterns = {};
		for (const access of this.accessLog) {
			if (!accessPatterns[access.agent]) accessPatterns[access.agent] = [];
			accessPatterns[access.agent].push(access);
		}
		return {
			unusedKeys,
			accessPatterns
		};
	}
	clearAccessLog() {
		return new StateManager({
			schema: this.schema,
			initial: {},
			logger: this.logger
		}, this.state, []);
	}
	reset(initialState) {
		return new StateManager({
			schema: this.schema,
			initial: initialState || {},
			logger: this.logger
		}, void 0, []);
	}
	merge(updates) {
		const newState = {
			...this.state,
			...updates
		};
		return new StateManager({
			schema: this.schema,
			initial: {},
			logger: this.logger
		}, newState, this.accessLog);
	}
};
var BaseAgent;
var init_base_agent = __esmMin((() => {
	BaseAgent = class {
		constructor(config) {
			this.config = config;
			this.name = config.name;
			this.type = config.operation;
		}
		async execute(context) {
			const startTime = Date.now();
			try {
				const result = await this.run(context);
				const executionTime = Date.now() - startTime;
				return this.wrapSuccess(result, executionTime, false);
			} catch (error) {
				const executionTime = Date.now() - startTime;
				return this.wrapError(error, executionTime);
			}
		}
		wrapSuccess(data, executionTime, cached = false) {
			return {
				success: true,
				data,
				timestamp: (/* @__PURE__ */ new Date()).toISOString(),
				cached,
				executionTime,
				metadata: {
					agent: this.name,
					type: this.type
				}
			};
		}
		wrapError(error, executionTime) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error occurred",
				timestamp: (/* @__PURE__ */ new Date()).toISOString(),
				cached: false,
				executionTime,
				metadata: {
					agent: this.name,
					type: this.type
				}
			};
		}
		async generateCacheKey(input) {
			const inputString = JSON.stringify(this.sortObjectKeys(input));
			const hash = await this.hashString(inputString);
			return `agent:${this.name}:${hash}`;
		}
		sortObjectKeys(obj) {
			if (typeof obj !== "object" || obj === null) return obj;
			if (Array.isArray(obj)) return obj.map((item) => this.sortObjectKeys(item));
			const sorted = {};
			const keys = Object.keys(obj).sort();
			for (const key of keys) sorted[key] = this.sortObjectKeys(obj[key]);
			return sorted;
		}
		async hashString(str) {
			const data = new TextEncoder().encode(str);
			const hashBuffer = await crypto.subtle.digest("SHA-256", data);
			return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("").substring(0, 16);
		}
		getConfig() {
			return this.config;
		}
		getName() {
			return this.name;
		}
		getType() {
			return this.type;
		}
	};
}));
init_base_agent();
var FunctionAgent = class FunctionAgent extends BaseAgent {
	constructor(config, implementation) {
		super(config);
		if (typeof implementation !== "function") throw new Error(`Function agent "${config.name}" requires a function implementation`);
		this.implementation = implementation;
	}
	async run(context) {
		try {
			return await this.implementation(context);
		} catch (error) {
			throw new Error(`Function agent "${this.name}" execution failed: ${error instanceof Error ? error.message : "Unknown error"}`);
		}
	}
	getImplementation() {
		return this.implementation;
	}
	static fromConfig(config) {
		const handler = config.config?.handler;
		if (typeof handler === "function") {
			const implementation = async (context) => {
				return await handler(context.input, context);
			};
			return new FunctionAgent(config, implementation);
		}
		return null;
	}
};
var ComponentLoader = class {
	constructor(options) {
		this.kv = options.kv;
		this.cache = options.cache;
		this.logger = options.logger;
		this.defaultVersion = options.defaultVersion || "latest";
	}
	parseURI(uri) {
		const match = uri.match(/^(\w+):\/\/([^@]+)(?:@(.+))?$/);
		if (!match) throw new Error(`Invalid component URI: ${uri}\nExpected format: {protocol}://{path}[@{version}]\nExamples:\n  - template://components/header\n  - template://components/header@latest\n  - prompt://analyze-company@v1.0.0`);
		const [, protocol, path$1, version] = match;
		const validProtocols = [
			"template",
			"prompt",
			"query",
			"config",
			"script",
			"schema",
			"docs"
		];
		if (!validProtocols.includes(protocol)) throw new Error(`Invalid protocol: ${protocol}\nValid protocols: ${validProtocols.join(", ")}`);
		return {
			protocol,
			path: path$1,
			version: version || this.defaultVersion,
			originalURI: uri
		};
	}
	getPrefix(protocol) {
		return {
			template: "templates",
			prompt: "prompts",
			query: "queries",
			config: "configs",
			script: "scripts",
			schema: "schemas",
			docs: "docs"
		}[protocol];
	}
	buildKVKey(parsed) {
		return `${this.getPrefix(parsed.protocol)}/${parsed.path}@${parsed.version}`;
	}
	buildCacheKey(uri) {
		return `components:${uri}`;
	}
	async load(uri, options) {
		const cacheKey = this.buildCacheKey(uri);
		const bypass = options?.cache?.bypass ?? false;
		const ttl = options?.cache?.ttl ?? 3600;
		if (this.cache && !bypass) {
			const cacheResult = await this.cache.get(cacheKey);
			if (cacheResult.success && cacheResult.value !== null) {
				this.logger?.debug("Component cache hit", {
					uri,
					cacheKey
				});
				return cacheResult.value;
			}
		}
		const parsed = this.parseURI(uri);
		const kvKey = this.buildKVKey(parsed);
		this.logger?.debug("Loading component from KV", {
			uri,
			kvKey,
			bypass
		});
		const content = await this.kv.get(kvKey, "text");
		if (!content) {
			this.logger?.warn("Component not found", {
				uri,
				kvKey
			});
			throw new Error(`Component not found: ${uri}\nKV key: ${kvKey}\nMake sure the component is deployed to KV with:\n  edgit components add <name> <path> ${parsed.protocol}\n  edgit tag create <name> ${parsed.version}\n  edgit deploy set <name> ${parsed.version} --to production`);
		}
		if (this.cache && !bypass) {
			if ((await this.cache.set(cacheKey, content, { ttl })).success) this.logger?.debug("Component cached", {
				uri,
				cacheKey,
				ttl
			});
		}
		return content;
	}
	async loadJSON(uri, options) {
		const content = await this.load(uri, options);
		try {
			return JSON.parse(content);
		} catch (error) {
			const err = error instanceof Error ? error : new Error(String(error));
			this.logger?.error("JSON parse error", err, { uri });
			throw new Error(`Failed to parse JSON component: ${uri}\nError: ${err.message}`);
		}
	}
	async loadCompiled(uri, options) {
		const content = await this.load(uri, options);
		try {
			const module$1 = new Function("exports", content);
			const exports$1 = {};
			module$1(exports$1);
			return exports$1.default || exports$1;
		} catch (error) {
			const err = error instanceof Error ? error : new Error(String(error));
			this.logger?.error("Component compilation error", err, { uri });
			throw new Error(`Failed to load compiled component: ${uri}\nError: ${err.message}\nMake sure the component was compiled with: npm run build:pages`);
		}
	}
	async exists(uri) {
		try {
			const parsed = this.parseURI(uri);
			const kvKey = this.buildKVKey(parsed);
			return (await this.kv.getWithMetadata(kvKey)).value !== null;
		} catch (error) {
			this.logger?.debug("Component exists check failed", {
				uri,
				error
			});
			return false;
		}
	}
	async listVersions(protocol, path$1) {
		const listPrefix = `${this.getPrefix(protocol)}/${path$1}@`;
		return (await this.kv.list({ prefix: listPrefix })).keys.map((key) => {
			const match = key.name.match(/@(.+)$/);
			return match ? match[1] : "unknown";
		});
	}
	async invalidateCache(uri) {
		if (this.cache) {
			const cacheKey = this.buildCacheKey(uri);
			if ((await this.cache.delete(cacheKey)).success) this.logger?.info("Component cache invalidated", {
				uri,
				cacheKey
			});
		}
	}
};
function createComponentLoader(options) {
	return new ComponentLoader(options);
}
init_base_agent();
var CodeAgent = class CodeAgent extends BaseAgent {
	constructor(config) {
		super(config);
		this.codeConfig = config.config || {};
		if (!this.codeConfig.script && !this.codeConfig.handler) throw new Error(`Code agent "${config.name}" requires either a script URI or inline handler`);
		if (this.codeConfig.handler) this.compiledFunction = this.codeConfig.handler;
	}
	async run(context) {
		try {
			if (!this.compiledFunction && this.codeConfig.script) this.compiledFunction = await this.loadScript(context);
			if (!this.compiledFunction) throw new Error("No code implementation available");
			return await this.compiledFunction(context);
		} catch (error) {
			throw new Error(`Code agent "${this.name}" execution failed: ${error instanceof Error ? error.message : "Unknown error"}`);
		}
	}
	async loadScript(context) {
		const scriptUri = this.codeConfig.script;
		if (!scriptUri) throw new Error("No script URI provided");
		if (!context.env.COMPONENTS) throw new Error("COMPONENTS KV namespace not configured");
		const componentLoader = createComponentLoader({
			kv: context.env.COMPONENTS,
			logger: context.logger
		});
		context.logger?.debug("Loading script from KV", { uri: scriptUri });
		const scriptContent = await componentLoader.load(scriptUri, { cache: this.codeConfig.cache });
		try {
			const fn = new Function("exports", "context", `
        ${scriptContent}
        if (typeof exports.default === 'function') {
          return exports.default;
        }
        throw new Error('Script must export a default function');
      `)({}, context);
			if (typeof fn !== "function") throw new Error("Script must export a default function");
			return fn;
		} catch (error) {
			context.logger?.error("Script compilation failed", error, { uri: scriptUri });
			throw new Error(`Failed to compile script: ${scriptUri}\nError: ${error instanceof Error ? error.message : String(error)}\nMake sure your script exports a default function:\n  export default async function(context) { ... }`);
		}
	}
	static fromConfig(config) {
		const codeConfig = config.config;
		if (codeConfig?.script || codeConfig?.handler) return new CodeAgent(config);
		return null;
	}
};
var BaseAIProvider = class {
	validateConfig(config, env) {
		return this.getConfigError(config, env) === null;
	}
	getApiKey(config, env, envVarName) {
		return config.apiKey || env[envVarName] || null;
	}
	async makeRequest(endpoint, headers, body) {
		const response = await fetch(endpoint, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...headers
			},
			body: JSON.stringify(body)
		});
		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`API request failed: ${response.status} ${response.statusText}\n${errorText}`);
		}
		return await response.json();
	}
};
var OpenAIProvider = class extends BaseAIProvider {
	constructor(..._args) {
		super(..._args);
		this.id = "openai";
		this.name = "OpenAI";
		this.defaultEndpoint = "https://api.openai.com/v1/chat/completions";
	}
	async execute(request) {
		const { messages, config, env } = request;
		const apiKey = this.getApiKey(config, env, "OPENAI_API_KEY");
		if (!apiKey) throw new Error("OpenAI API key not found. Set OPENAI_API_KEY in env or config");
		const endpoint = config.apiEndpoint || this.defaultEndpoint;
		const data = await this.makeRequest(endpoint, { Authorization: `Bearer ${apiKey}` }, {
			model: config.model,
			messages,
			temperature: config.temperature,
			max_tokens: config.maxTokens
		});
		return {
			content: data.choices[0]?.message?.content || "",
			model: config.model,
			tokensUsed: data.usage?.total_tokens,
			provider: this.id,
			metadata: {
				finishReason: data.choices[0]?.finish_reason,
				promptTokens: data.usage?.prompt_tokens,
				completionTokens: data.usage?.completion_tokens
			}
		};
	}
	getConfigError(config, env) {
		if (!this.getApiKey(config, env, "OPENAI_API_KEY")) return "OpenAI API key not found. Set OPENAI_API_KEY in env or config.apiKey";
		return null;
	}
};
var AnthropicProvider = class extends BaseAIProvider {
	constructor(..._args) {
		super(..._args);
		this.id = "anthropic";
		this.name = "Anthropic";
		this.defaultEndpoint = "https://api.anthropic.com/v1/messages";
		this.defaultModel = "claude-3-sonnet-20240229";
	}
	async execute(request) {
		const { messages, config, env } = request;
		const apiKey = this.getApiKey(config, env, "ANTHROPIC_API_KEY");
		if (!apiKey) throw new Error("Anthropic API key not found. Set ANTHROPIC_API_KEY in env or config");
		const endpoint = config.apiEndpoint || this.defaultEndpoint;
		const anthropicMessages = messages.filter((m) => m.role !== "system");
		const systemMessage = messages.find((m) => m.role === "system")?.content || config.systemPrompt;
		const requestBody = {
			model: config.model || this.defaultModel,
			messages: anthropicMessages,
			system: systemMessage,
			temperature: config.temperature,
			max_tokens: config.maxTokens
		};
		if (config.schema) requestBody.response_format = {
			type: "json_schema",
			json_schema: typeof config.schema === "string" ? JSON.parse(config.schema) : config.schema
		};
		const data = await this.makeRequest(endpoint, {
			"x-api-key": apiKey,
			"anthropic-version": "2023-06-01"
		}, requestBody);
		return {
			content: data.content[0]?.text || "",
			model: config.model || this.defaultModel,
			tokensUsed: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
			provider: this.id,
			metadata: {
				stopReason: data.stop_reason,
				inputTokens: data.usage?.input_tokens,
				outputTokens: data.usage?.output_tokens,
				schema: config.schema ? typeof config.schema === "string" ? config.schema : JSON.stringify(config.schema) : void 0
			}
		};
	}
	getConfigError(config, env) {
		if (!this.getApiKey(config, env, "ANTHROPIC_API_KEY")) return "Anthropic API key not found. Set ANTHROPIC_API_KEY in env or config.apiKey";
		return null;
	}
};
var CloudflareProvider = class extends BaseAIProvider {
	constructor(..._args) {
		super(..._args);
		this.id = "workers-ai";
		this.name = "Cloudflare Workers AI";
		this.defaultModel = "@cf/meta/llama-2-7b-chat-int8";
	}
	async execute(request) {
		const { messages, config, env } = request;
		if (!env.AI) throw new Error("Cloudflare AI binding not available. Add [ai] binding = \"AI\" to wrangler.toml");
		const model = config.model || this.defaultModel;
		const response = await env.AI.run(model, {
			messages,
			temperature: config.temperature,
			max_tokens: config.maxTokens
		});
		return {
			content: response.response || response.result?.response || String(response),
			model,
			tokensUsed: response.tokens_used,
			provider: this.id,
			metadata: { raw: response }
		};
	}
	getConfigError(config, env) {
		if (!env.AI) return "Cloudflare AI binding not found. Add [ai] binding = \"AI\" to wrangler.toml";
		return null;
	}
};
var CustomProvider = class extends BaseAIProvider {
	constructor(..._args) {
		super(..._args);
		this.id = "custom";
		this.name = "Custom API";
	}
	async execute(request) {
		const { messages, config, env } = request;
		if (!config.apiEndpoint) throw new Error("Custom provider requires apiEndpoint in config");
		const apiKey = this.getApiKey(config, env, "AI_API_KEY");
		const headers = {};
		if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
		const data = await this.makeRequest(config.apiEndpoint, headers, {
			model: config.model,
			messages,
			temperature: config.temperature,
			max_tokens: config.maxTokens
		});
		return {
			content: data.choices?.[0]?.message?.content || data.response || data.content || "",
			model: config.model,
			tokensUsed: data.usage?.total_tokens,
			provider: this.id,
			metadata: data
		};
	}
	getConfigError(config, env) {
		if (!config.apiEndpoint) return "Custom provider requires apiEndpoint in config";
		return null;
	}
};
var ProviderRegistry = class {
	constructor() {
		this.providers = /* @__PURE__ */ new Map();
		this.registerDefaultProviders();
	}
	registerDefaultProviders() {
		this.register(new OpenAIProvider());
		this.register(new AnthropicProvider());
		this.register(new CloudflareProvider());
		this.register(new CustomProvider());
	}
	register(provider) {
		this.providers.set(provider.id, provider);
	}
	get(providerId) {
		return this.providers.get(providerId) || null;
	}
	has(providerId) {
		return this.providers.has(providerId);
	}
	getProviderIds() {
		return Array.from(this.providers.keys());
	}
	getAllProviders() {
		return Array.from(this.providers.values());
	}
};
var globalRegistry = null;
function getProviderRegistry() {
	if (!globalRegistry) globalRegistry = new ProviderRegistry();
	return globalRegistry;
}
function isComponentReference(value) {
	return /^[a-z0-9-_]+\/[a-z0-9-_/]+@[a-z0-9.-]+$/i.test(value);
}
function isUnversionedComponent(value) {
	return /^[a-z0-9-_]+\/[a-z0-9-_/]+$/i.test(value) && !value.includes("@");
}
async function loadFromFile(filePath, context) {
	const baseDir = context.baseDir || process.cwd();
	const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(baseDir, filePath);
	try {
		return await fs$1.readFile(absolutePath, "utf-8");
	} catch (error) {
		throw new Error(`Failed to load file: ${filePath}\nResolved to: ${absolutePath}\nError: ${error}`);
	}
}
async function resolveComponentRef(ref, context) {
	const [pathPart, version] = ref.split("@");
	if (context.env?.EDGIT) {
		const edgitPath = `components/${pathPart}/${version}`;
		try {
			const content = await context.env.EDGIT.get(edgitPath);
			if (content) try {
				return JSON.parse(content);
			} catch {
				return content;
			}
		} catch (error) {
			console.warn(`Failed to fetch from Edgit: ${edgitPath}`, error);
		}
	}
	const localPath = `./${pathPart}.yaml`;
	try {
		const content = await loadFromFile(localPath, context);
		try {
			return JSON.parse(content);
		} catch {
			return content;
		}
	} catch (error) {
		throw new Error(`Component not found: ${ref}\nTried Edgit: components/${pathPart}/${version}\nTried local: ${localPath}\nError: ${error}`);
	}
}
async function resolveValue(value, context) {
	if (typeof value !== "string") return {
		content: value,
		source: "inline",
		originalRef: value
	};
	if (value.includes("\n")) return {
		content: value,
		source: "inline",
		originalRef: value
	};
	if (value.match(/^\.{0,2}\//)) return {
		content: await loadFromFile(value, context),
		source: "file",
		originalRef: value
	};
	if (isComponentReference(value)) {
		const content = await resolveComponentRef(value, context);
		const [pathPart, version] = value.split("@");
		return {
			content,
			source: "component",
			originalRef: value,
			metadata: {
				path: pathPart,
				version,
				fromEdgit: !!context.env?.EDGIT
			}
		};
	}
	if (isUnversionedComponent(value)) return {
		content: await resolveComponentRef(`${value}@latest`, context),
		source: "component",
		originalRef: value,
		metadata: {
			path: value,
			version: "latest",
			fromEdgit: !!context.env?.EDGIT
		}
	};
	return {
		content: value,
		source: "inline",
		originalRef: value
	};
}
init_base_agent();
var ThinkAgent = class extends BaseAgent {
	constructor(config, providerRegistry) {
		super(config);
		this.providerRegistry = providerRegistry || getProviderRegistry();
		const cfg = config.config;
		this.thinkConfig = {
			model: cfg?.model || "claude-3-5-haiku-20241022",
			provider: cfg?.provider || AIProvider.Anthropic,
			temperature: cfg?.temperature || .7,
			maxTokens: cfg?.maxTokens || 1e3,
			apiKey: cfg?.apiKey,
			apiEndpoint: cfg?.apiEndpoint,
			systemPrompt: cfg?.systemPrompt,
			prompt: cfg?.prompt,
			schema: cfg?.schema
		};
	}
	async run(context) {
		const { input, env } = context;
		await this.resolvePrompt(env);
		await this.resolveSchema(env);
		const providerId = this.thinkConfig.provider || AIProvider.Anthropic;
		const provider = this.providerRegistry.get(providerId);
		if (!provider) throw new Error(`Unknown AI provider: ${providerId}. Available providers: ${this.providerRegistry.getProviderIds().join(", ")}`);
		const providerConfig = {
			model: this.thinkConfig.model || "claude-3-5-haiku-20241022",
			temperature: this.thinkConfig.temperature,
			maxTokens: this.thinkConfig.maxTokens,
			apiKey: this.thinkConfig.apiKey,
			apiEndpoint: this.thinkConfig.apiEndpoint,
			systemPrompt: this.thinkConfig.systemPrompt,
			schema: this.thinkConfig.schema
		};
		const configError = provider.getConfigError(providerConfig, env);
		if (configError) throw new Error(configError);
		const messages = this.buildMessages(input);
		return await provider.execute({
			messages,
			config: providerConfig,
			env
		});
	}
	async resolvePrompt(env) {
		if (this.thinkConfig.systemPrompt) return;
		if (this.thinkConfig.prompt) {
			const context = {
				env,
				baseDir: process.cwd()
			};
			try {
				const resolved = await resolveValue(this.thinkConfig.prompt, context);
				if (typeof resolved.content === "string") this.thinkConfig.systemPrompt = resolved.content;
				else throw new Error(`Prompt must resolve to a string, got ${typeof resolved.content}`);
			} catch (error) {
				throw new Error(`Failed to resolve prompt "${this.thinkConfig.prompt}": ${error instanceof Error ? error.message : String(error)}`);
			}
		}
	}
	async resolveSchema(env) {
		if (!this.thinkConfig.schema) return;
		if (typeof this.thinkConfig.schema !== "string") return;
		const context = {
			env,
			baseDir: process.cwd()
		};
		try {
			const resolved = await resolveValue(this.thinkConfig.schema, context);
			if (typeof resolved.content === "object" && resolved.content !== null) this.thinkConfig.schema = resolved.content;
			else if (typeof resolved.content === "string") try {
				this.thinkConfig.schema = JSON.parse(resolved.content);
			} catch {
				throw new Error(`Schema must be valid JSON, got invalid string`);
			}
			else throw new Error(`Schema must resolve to an object or JSON string, got ${typeof resolved.content}`);
		} catch (error) {
			throw new Error(`Failed to resolve schema "${this.thinkConfig.schema}": ${error instanceof Error ? error.message : String(error)}`);
		}
	}
	buildMessages(input) {
		const messages = [];
		if (this.thinkConfig.systemPrompt) messages.push({
			role: "system",
			content: this.thinkConfig.systemPrompt
		});
		if (input.messages && Array.isArray(input.messages)) messages.push(...input.messages);
		else if (input.prompt) messages.push({
			role: "user",
			content: input.prompt
		});
		else {
			const promptParts = [];
			for (const [key, value] of Object.entries(input)) if (typeof value === "string") promptParts.push(`${key}: ${value}`);
			else promptParts.push(`${key}: ${JSON.stringify(value, null, 2)}`);
			messages.push({
				role: "user",
				content: promptParts.join("\n\n")
			});
		}
		return messages;
	}
	getThinkConfig() {
		return { ...this.thinkConfig };
	}
};
var JSONSerializer = class {
	serialize(value) {
		return JSON.stringify(value);
	}
	deserialize(raw) {
		return JSON.parse(raw);
	}
};
var KVRepository = class {
	constructor(binding, serializer = new JSONSerializer()) {
		this.binding = binding;
		this.serializer = serializer;
	}
	async get(key) {
		try {
			const raw = await this.binding.get(key);
			if (raw === null) return Result.err(Errors.storageNotFound(key, "KV"));
			const value = this.serializer.deserialize(raw);
			return Result.ok(value);
		} catch (error) {
			return Result.err(Errors.internal(`KV get operation failed for key "${key}"`, error instanceof Error ? error : void 0));
		}
	}
	async put(key, value, options) {
		try {
			const serialized = this.serializer.serialize(value);
			const kvOptions = {};
			if (options?.ttl) kvOptions.expirationTtl = options.ttl;
			if (options?.expiration) kvOptions.expiration = options.expiration;
			if (options?.metadata) kvOptions.metadata = options.metadata;
			await this.binding.put(key, serialized, kvOptions);
			return Result.ok(void 0);
		} catch (error) {
			return Result.err(Errors.internal(`KV put operation failed for key "${key}"`, error instanceof Error ? error : void 0));
		}
	}
	async delete(key) {
		try {
			await this.binding.delete(key);
			return Result.ok(void 0);
		} catch (error) {
			return Result.err(Errors.internal(`KV delete operation failed for key "${key}"`, error instanceof Error ? error : void 0));
		}
	}
	async list(options) {
		try {
			const listOptions = {};
			if (options?.prefix) listOptions.prefix = options.prefix;
			if (options?.limit) listOptions.limit = options.limit;
			if (options?.cursor) listOptions.cursor = options.cursor;
			const result = await this.binding.list(listOptions);
			const values = [];
			for (const key of result.keys) {
				const getResult = await this.get(key.name);
				if (getResult.success) values.push(getResult.value);
			}
			return Result.ok(values);
		} catch (error) {
			return Result.err(Errors.internal("KV list operation failed", error instanceof Error ? error : void 0));
		}
	}
	async has(key) {
		try {
			const value = await this.binding.get(key);
			return Result.ok(value !== null);
		} catch (error) {
			return Result.err(Errors.internal(`KV has operation failed for key "${key}"`, error instanceof Error ? error : void 0));
		}
	}
	async getWithMetadata(key) {
		try {
			const result = await this.binding.getWithMetadata(key);
			if (result.value === null) return Result.err(Errors.storageNotFound(key, "KV"));
			const value = this.serializer.deserialize(result.value);
			return Result.ok({
				value,
				metadata: result.metadata
			});
		} catch (error) {
			return Result.err(Errors.internal(`KV getWithMetadata operation failed for key "${key}"`, error instanceof Error ? error : void 0));
		}
	}
};
var D1Repository = class {
	constructor(binding, config, serializer = new JSONSerializer()) {
		this.binding = binding;
		this.serializer = serializer;
		this.tableName = config.tableName;
		this.idColumn = config.idColumn || "id";
		this.valueColumn = config.valueColumn || "value";
		this.createdAtColumn = config.createdAtColumn || "created_at";
		this.updatedAtColumn = config.updatedAtColumn || "updated_at";
		this.expirationColumn = config.expirationColumn;
	}
	async get(id$1) {
		try {
			const query = `
				SELECT ${this.valueColumn}, ${this.expirationColumn || "NULL as expiration"}
				FROM ${this.tableName}
				WHERE ${this.idColumn} = ?
			`;
			const result = await this.binding.prepare(query).bind(id$1).first();
			if (!result) return Result.err(Errors.storageNotFound(id$1, "D1"));
			if (this.expirationColumn && result.expiration) {
				if (new Date(result.expiration).getTime() < Date.now()) {
					await this.delete(id$1);
					return Result.err(Errors.storageNotFound(id$1, "D1"));
				}
			}
			const value = this.serializer.deserialize(result[this.valueColumn]);
			return Result.ok(value);
		} catch (error) {
			return Result.err(Errors.internal(`D1 get operation failed for id "${id$1}"`, error instanceof Error ? error : void 0));
		}
	}
	async put(id$1, value, options) {
		try {
			const serialized = this.serializer.serialize(value);
			const now = (/* @__PURE__ */ new Date()).toISOString();
			let query;
			let params;
			if (this.expirationColumn && (options?.ttl || options?.expiration)) {
				const expiration = options.expiration ? (/* @__PURE__ */ new Date(options.expiration * 1e3)).toISOString() : new Date(Date.now() + options.ttl * 1e3).toISOString();
				query = `
					INSERT INTO ${this.tableName}
					(${this.idColumn}, ${this.valueColumn}, ${this.createdAtColumn}, ${this.updatedAtColumn}, ${this.expirationColumn})
					VALUES (?, ?, ?, ?, ?)
					ON CONFLICT(${this.idColumn})
					DO UPDATE SET
						${this.valueColumn} = excluded.${this.valueColumn},
						${this.updatedAtColumn} = excluded.${this.updatedAtColumn},
						${this.expirationColumn} = excluded.${this.expirationColumn}
				`;
				params = [
					id$1,
					serialized,
					now,
					now,
					expiration
				];
			} else {
				query = `
					INSERT INTO ${this.tableName}
					(${this.idColumn}, ${this.valueColumn}, ${this.createdAtColumn}, ${this.updatedAtColumn})
					VALUES (?, ?, ?, ?)
					ON CONFLICT(${this.idColumn})
					DO UPDATE SET
						${this.valueColumn} = excluded.${this.valueColumn},
						${this.updatedAtColumn} = excluded.${this.updatedAtColumn}
				`;
				params = [
					id$1,
					serialized,
					now,
					now
				];
			}
			await this.binding.prepare(query).bind(...params).run();
			return Result.ok(void 0);
		} catch (error) {
			return Result.err(Errors.internal(`D1 put operation failed for id "${id$1}"`, error instanceof Error ? error : void 0));
		}
	}
	async delete(id$1) {
		try {
			const query = `DELETE FROM ${this.tableName} WHERE ${this.idColumn} = ?`;
			await this.binding.prepare(query).bind(id$1).run();
			return Result.ok(void 0);
		} catch (error) {
			return Result.err(Errors.internal(`D1 delete operation failed for id "${id$1}"`, error instanceof Error ? error : void 0));
		}
	}
	async list(options) {
		try {
			let query = `SELECT ${this.valueColumn} FROM ${this.tableName}`;
			const params = [];
			if (options?.prefix) {
				query += ` WHERE ${this.idColumn} LIKE ?`;
				params.push(`${options.prefix}%`);
			}
			if (this.expirationColumn) {
				const whereOrAnd = options?.prefix ? "AND" : "WHERE";
				query += ` ${whereOrAnd} (${this.expirationColumn} IS NULL OR ${this.expirationColumn} > datetime('now'))`;
			}
			query += ` ORDER BY ${this.createdAtColumn} DESC`;
			if (options?.limit) {
				query += ` LIMIT ?`;
				params.push(options.limit);
			}
			const values = (await this.binding.prepare(query).bind(...params).all()).results.map((row) => this.serializer.deserialize(row[this.valueColumn]));
			return Result.ok(values);
		} catch (error) {
			return Result.err(Errors.internal("D1 list operation failed", error instanceof Error ? error : void 0));
		}
	}
	async has(id$1) {
		try {
			const query = `SELECT 1 FROM ${this.tableName} WHERE ${this.idColumn} = ? LIMIT 1`;
			const result = await this.binding.prepare(query).bind(id$1).first();
			return Result.ok(result !== null);
		} catch (error) {
			return Result.err(Errors.internal(`D1 has operation failed for id "${id$1}"`, error instanceof Error ? error : void 0));
		}
	}
	async cleanExpired() {
		if (!this.expirationColumn) return Result.ok(0);
		try {
			const query = `
				DELETE FROM ${this.tableName}
				WHERE ${this.expirationColumn} IS NOT NULL
				AND ${this.expirationColumn} <= datetime('now')
			`;
			const result = await this.binding.prepare(query).run();
			return Result.ok(result.meta.changes || 0);
		} catch (error) {
			return Result.err(Errors.internal("D1 cleanExpired operation failed", error instanceof Error ? error : void 0));
		}
	}
};
var R2Repository = class {
	constructor(binding, serializer = new JSONSerializer()) {
		this.binding = binding;
		this.serializer = serializer;
	}
	async get(key) {
		try {
			const object = await this.binding.get(key);
			if (object === null) return Result.err(Errors.storageNotFound(key, "R2"));
			const text = await object.text();
			const value = this.serializer.deserialize(text);
			return Result.ok(value);
		} catch (error) {
			return Result.err(Errors.internal(`R2 get operation failed for key "${key}"`, error instanceof Error ? error : void 0));
		}
	}
	async put(key, value, options) {
		try {
			const serialized = this.serializer.serialize(value);
			const r2Options = {};
			if (options?.metadata) r2Options.customMetadata = options.metadata;
			if (options?.ttl) {
				const expiration = Date.now() + options.ttl * 1e3;
				r2Options.customMetadata = {
					...r2Options.customMetadata,
					"x-expiration": expiration.toString()
				};
			}
			if (options?.expiration) r2Options.customMetadata = {
				...r2Options.customMetadata,
				"x-expiration": (options.expiration * 1e3).toString()
			};
			await this.binding.put(key, serialized, r2Options);
			return Result.ok(void 0);
		} catch (error) {
			return Result.err(Errors.internal(`R2 put operation failed for key "${key}"`, error instanceof Error ? error : void 0));
		}
	}
	async delete(key) {
		try {
			await this.binding.delete(key);
			return Result.ok(void 0);
		} catch (error) {
			return Result.err(Errors.internal(`R2 delete operation failed for key "${key}"`, error instanceof Error ? error : void 0));
		}
	}
	async list(options) {
		try {
			const listOptions = {};
			if (options?.prefix) listOptions.prefix = options.prefix;
			if (options?.limit) listOptions.limit = options.limit;
			if (options?.cursor) listOptions.cursor = options.cursor;
			const result = await this.binding.list(listOptions);
			const values = [];
			for (const object of result.objects) {
				const getResult = await this.get(object.key);
				if (getResult.success) {
					const expiration = object.customMetadata?.["x-expiration"];
					if (expiration) {
						if (parseInt(expiration, 10) < Date.now()) {
							await this.delete(object.key);
							continue;
						}
					}
					values.push(getResult.value);
				}
			}
			return Result.ok(values);
		} catch (error) {
			return Result.err(Errors.internal("R2 list operation failed", error instanceof Error ? error : void 0));
		}
	}
	async has(key) {
		try {
			const object = await this.binding.head(key);
			return Result.ok(object !== null);
		} catch (error) {
			return Result.err(Errors.internal(`R2 has operation failed for key "${key}"`, error instanceof Error ? error : void 0));
		}
	}
	async getWithMetadata(key) {
		try {
			const object = await this.binding.get(key);
			if (object === null) return Result.err(Errors.storageNotFound(key, "R2"));
			const text = await object.text();
			const value = this.serializer.deserialize(text);
			return Result.ok({
				value,
				metadata: object
			});
		} catch (error) {
			return Result.err(Errors.internal(`R2 getWithMetadata operation failed for key "${key}"`, error instanceof Error ? error : void 0));
		}
	}
	async getMetadata(key) {
		try {
			const metadata = await this.binding.head(key);
			return Result.ok(metadata);
		} catch (error) {
			return Result.err(Errors.internal(`R2 getMetadata operation failed for key "${key}"`, error instanceof Error ? error : void 0));
		}
	}
};
async function exportData(data, options) {
	switch (options.format) {
		case "csv": return exportToCSV(data, options);
		case "json": return exportToJSON(data, options);
		case "ndjson": return exportToNDJSON(data, options);
		case "xlsx": return exportToExcel(data, options);
		default: throw new Error(`Unsupported export format: ${options.format}`);
	}
}
function exportToCSV(data, options) {
	const delimiter = options.delimiter || ",";
	const includeHeaders = options.headers !== false;
	if (data.length === 0) return {
		data: "",
		contentType: "text/csv",
		extension: "csv",
		size: 0,
		streaming: false
	};
	const fields = options.fields || Object.keys(data[0]);
	const lines = [];
	if (includeHeaders) lines.push(fields.map((f) => escapeCsvValue(f, delimiter)).join(delimiter));
	for (const row of data) {
		const rowData = row;
		const values = fields.map((field) => {
			const value = rowData[field];
			return escapeCsvValue(String(value ?? ""), delimiter);
		});
		lines.push(values.join(delimiter));
	}
	const csv = lines.join("\n");
	return {
		data: csv,
		contentType: "text/csv",
		extension: "csv",
		size: new Blob([csv]).size,
		streaming: false
	};
}
function exportToJSON(data, options) {
	const json$1 = options.pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
	return {
		data: json$1,
		contentType: "application/json",
		extension: "json",
		size: new Blob([json$1]).size,
		streaming: false
	};
}
function exportToNDJSON(data, options) {
	const ndjson = data.map((item) => JSON.stringify(item)).join("\n");
	return {
		data: ndjson,
		contentType: "application/x-ndjson",
		extension: "ndjson",
		size: new Blob([ndjson]).size,
		streaming: false
	};
}
function exportToExcel(data, options) {
	return {
		...exportToCSV(data, options),
		contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		extension: "xlsx"
	};
}
function escapeCsvValue(value, delimiter) {
	if (value.includes(delimiter) || value.includes("\n") || value.includes("\"")) return `"${value.replace(/"/g, "\"\"")}"`;
	return value;
}
function createStreamingExport(dataSource, options) {
	let isFirst = true;
	let fields = [];
	return {
		data: new ReadableStream({ async start(controller) {
			const encoder = new TextEncoder();
			try {
				for await (const batch of dataSource) {
					if (batch.length === 0) continue;
					if (isFirst) {
						fields = options.fields || Object.keys(batch[0]);
						if (options.format === "csv" && options.headers !== false) {
							const delimiter = options.delimiter || ",";
							const headerLine = fields.map((f) => escapeCsvValue(f, delimiter)).join(delimiter) + "\n";
							controller.enqueue(encoder.encode(headerLine));
						}
						if (options.format === "json") controller.enqueue(encoder.encode("[\n"));
						isFirst = false;
					}
					const chunk = formatBatch(batch, fields, options, isFirst);
					controller.enqueue(encoder.encode(chunk));
				}
				if (options.format === "json") controller.enqueue(encoder.encode("\n]"));
				controller.close();
			} catch (error) {
				controller.error(error);
			}
		} }),
		contentType: getContentType(options.format),
		extension: getExtension(options.format),
		streaming: true
	};
}
function formatBatch(batch, fields, options, isFirst) {
	switch (options.format) {
		case "csv": return formatCsvBatch(batch, fields, options.delimiter || ",");
		case "json": return formatJsonBatch(batch, isFirst);
		case "ndjson": return formatNdjsonBatch(batch);
		default: return "";
	}
}
function formatCsvBatch(batch, fields, delimiter) {
	const lines = [];
	for (const row of batch) {
		const rowData = row;
		const values = fields.map((field) => {
			const value = rowData[field];
			return escapeCsvValue(String(value ?? ""), delimiter);
		});
		lines.push(values.join(delimiter));
	}
	return lines.join("\n") + "\n";
}
function formatJsonBatch(batch, isFirst) {
	return batch.map((item, index) => {
		const json$1 = JSON.stringify(item, null, 2);
		return (isFirst && index === 0 ? "  " : ",\n  ") + json$1;
	}).join("");
}
function formatNdjsonBatch(batch) {
	return batch.map((item) => JSON.stringify(item)).join("\n") + "\n";
}
function getContentType(format$1) {
	switch (format$1) {
		case "csv": return "text/csv";
		case "json": return "application/json";
		case "ndjson": return "application/x-ndjson";
		case "xlsx": return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
		default: return "application/octet-stream";
	}
}
function getExtension(format$1) {
	switch (format$1) {
		case "csv": return "csv";
		case "json": return "json";
		case "ndjson": return "ndjson";
		case "xlsx": return "xlsx";
		default: return "bin";
	}
}
init_base_agent();
var DataAgent = class extends BaseAgent {
	constructor(config, repository) {
		super(config);
		this.repository = repository;
		const cfg = config.config;
		this.dataConfig = {
			storage: cfg?.storage,
			operation: cfg?.operation,
			binding: cfg?.binding,
			ttl: cfg?.ttl
		};
		if (!this.dataConfig.storage) throw new Error(`Data agent "${config.name}" requires storage type (kv, d1, or r2)`);
		if (!this.dataConfig.operation) throw new Error(`Data agent "${config.name}" requires operation type`);
	}
	async run(context) {
		const { input, env } = context;
		const repo = this.repository || this.createRepository(env);
		switch (this.dataConfig.operation) {
			case "get": return await this.executeGet(repo, input);
			case "put": return await this.executePut(repo, input);
			case "delete": return await this.executeDelete(repo, input);
			case "list": return await this.executeList(repo, input);
			case "query": return await this.executeQuery(repo, input);
			case "export": return await this.executeExport(repo, input);
			default: throw new Error(`Unknown operation: ${this.dataConfig.operation}`);
		}
	}
	async executeGet(repo, input) {
		if (!input.key) throw new Error("GET operation requires \"key\" in input");
		const result = await repo.get(input.key);
		if (result.success) return {
			key: input.key,
			value: result.value,
			found: true
		};
		else return {
			key: input.key,
			value: null,
			found: false,
			error: result.error.message
		};
	}
	async executePut(repo, input) {
		if (!input.key || input.value === void 0) throw new Error("PUT operation requires \"key\" and \"value\" in input");
		const result = await repo.put(input.key, input.value, { ttl: input.ttl || this.dataConfig.ttl });
		if (result.success) return {
			key: input.key,
			success: true
		};
		else return {
			key: input.key,
			success: false,
			error: result.error.message
		};
	}
	async executeDelete(repo, input) {
		if (!input.key) throw new Error("DELETE operation requires \"key\" in input");
		const result = await repo.delete(input.key);
		if (result.success) return {
			key: input.key,
			success: true
		};
		else return {
			key: input.key,
			success: false,
			error: result.error.message
		};
	}
	async executeList(repo, input) {
		const result = await repo.list({
			prefix: input.prefix,
			limit: input.limit,
			cursor: input.cursor
		});
		if (result.success) return {
			items: result.value,
			success: true
		};
		else return {
			items: [],
			success: false,
			error: result.error.message
		};
	}
	createRepository(env) {
		const bindingName = this.getBindingName();
		const binding = env[bindingName];
		if (!binding) throw new Error(`Binding "${bindingName}" not found. Add it to wrangler.toml or inject a repository in constructor.`);
		switch (this.dataConfig.storage) {
			case StorageType.KV: return new KVRepository(binding, new JSONSerializer());
			case StorageType.D1: return new D1Repository(binding, {
				tableName: "data",
				idColumn: "key",
				valueColumn: "value"
			}, new JSONSerializer());
			case StorageType.R2: return new R2Repository(binding, new JSONSerializer());
			default: throw new Error(`Unknown storage type: ${this.dataConfig.storage}`);
		}
	}
	getBindingName() {
		if (this.dataConfig.binding) return this.dataConfig.binding;
		switch (this.dataConfig.storage) {
			case StorageType.KV: return "CACHE";
			case StorageType.D1: return "DB";
			case StorageType.R2: return "STORAGE";
			default: return "DATA";
		}
	}
	async executeQuery(repo, input) {
		const listResult = await repo.list({
			prefix: input.prefix,
			limit: input.limit,
			cursor: input.cursor
		});
		if (!listResult.success) return {
			items: [],
			success: false,
			error: listResult.error.message
		};
		let items = listResult.value;
		if (input.filter) items = items.filter((item) => {
			return Object.entries(input.filter).every(([key, value]) => {
				return item[key] === value;
			});
		});
		if (input.sort) {
			const [field, order = "asc"] = input.sort.split(":");
			items = items.sort((a, b) => {
				const aVal = a[field];
				const bVal = b[field];
				if (order === "desc") return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
				return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
			});
		}
		return {
			items,
			count: items.length,
			success: true
		};
	}
	async executeExport(repo, input) {
		const listResult = await repo.list({
			prefix: input.prefix,
			limit: input.limit || 1e4,
			cursor: input.cursor
		});
		if (!listResult.success) return {
			success: false,
			error: listResult.error.message
		};
		let items = listResult.value;
		if (input.filter) items = items.filter((item) => {
			return Object.entries(input.filter).every(([key, value]) => {
				return item[key] === value;
			});
		});
		const exportOptions = {
			format: input.format || this.dataConfig.exportFormat || "json",
			...this.dataConfig.exportOptions,
			...input.exportOptions
		};
		if (input.streaming || items.length > 1e3) {
			async function* dataSource() {
				const batchSize = exportOptions.batchSize || 100;
				for (let i = 0; i < items.length; i += batchSize) yield items.slice(i, i + batchSize);
			}
			const exportResult$1 = createStreamingExport(dataSource(), exportOptions);
			return {
				success: true,
				streaming: true,
				stream: exportResult$1.data,
				contentType: exportResult$1.contentType,
				extension: exportResult$1.extension,
				count: items.length
			};
		}
		const exportResult = await exportData(items, exportOptions);
		return {
			success: true,
			streaming: false,
			data: exportResult.data,
			contentType: exportResult.contentType,
			extension: exportResult.extension,
			size: exportResult.size,
			count: items.length
		};
	}
	getDataConfig() {
		return { ...this.dataConfig };
	}
};
init_base_agent();
var APIAgent = class extends BaseAgent {
	constructor(config) {
		super(config);
		const cfg = config.config;
		this.apiConfig = {
			url: cfg?.url,
			method: cfg?.method || "GET",
			headers: cfg?.headers || {},
			timeout: cfg?.timeout || 3e4,
			retries: cfg?.retries || 0
		};
	}
	async run(context) {
		const { input } = context;
		const url = this.apiConfig.url || input.url;
		if (!url) throw new Error(`API agent "${this.name}" requires a URL (in config or input)`);
		const requestInit = {
			method: this.apiConfig.method,
			headers: this.resolveHeaders(this.apiConfig.headers || {}, context)
		};
		if ([
			"POST",
			"PUT",
			"PATCH"
		].includes(this.apiConfig.method)) {
			if (input.body) {
				requestInit.body = typeof input.body === "string" ? input.body : JSON.stringify(input.body);
				const headers = requestInit.headers;
				if (!headers["content-type"] && !headers["Content-Type"]) headers["content-type"] = "application/json";
			}
		}
		return await this.executeWithRetries(url, requestInit);
	}
	resolveHeaders(headers, context) {
		const resolved = {};
		for (const [key, value] of Object.entries(headers)) resolved[key] = value.replace(/\$\{env\.(\w+)\}/g, (_, varName) => {
			return context.env[varName] || "";
		});
		return resolved;
	}
	async executeWithRetries(url, init, attempt = 0) {
		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), this.apiConfig.timeout);
			try {
				const response = await fetch(url, {
					...init,
					signal: controller.signal
				});
				clearTimeout(timeoutId);
				const contentType = response.headers.get("content-type");
				let data;
				if (contentType?.includes("application/json")) data = await response.json();
				else data = await response.text();
				if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
				return {
					status: response.status,
					headers: Object.fromEntries(response.headers.entries()),
					data
				};
			} finally {
				clearTimeout(timeoutId);
			}
		} catch (error) {
			if (attempt < (this.apiConfig.retries || 0)) {
				const delay = Math.min(1e3 * Math.pow(2, attempt), 1e4);
				await new Promise((resolve$2) => setTimeout(resolve$2, delay));
				return this.executeWithRetries(url, init, attempt + 1);
			}
			throw new Error(`API request to ${url} failed after ${attempt + 1} attempts: ${error instanceof Error ? error.message : "Unknown error"}`);
		}
	}
	getAPIConfig() {
		return { ...this.apiConfig };
	}
};
var BaseEmailProvider = class {
	normalizeRecipients(recipients) {
		return Array.isArray(recipients) ? recipients : [recipients];
	}
	validateEmail(email) {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	}
	validateMessage(message) {
		const errors = [];
		if (!message.to || Array.isArray(message.to) && message.to.length === 0) errors.push("Recipient (to) is required");
		if (!message.subject || message.subject.trim() === "") errors.push("Subject is required");
		if (!message.html && !message.text) errors.push("Either html or text content is required");
		const recipients = this.normalizeRecipients(message.to);
		for (const email of recipients) if (!this.validateEmail(email)) errors.push(`Invalid email address: ${email}`);
		return {
			valid: errors.length === 0,
			errors: errors.length > 0 ? errors : void 0
		};
	}
};
var CloudflareEmailProvider = class extends BaseEmailProvider {
	constructor(binding, defaultFrom, enableDkim = true) {
		super();
		this.binding = binding;
		this.defaultFrom = defaultFrom;
		this.enableDkim = enableDkim;
		this.name = "cloudflare";
	}
	async send(message) {
		const validation = this.validateMessage(message);
		if (!validation.valid) return {
			messageId: "",
			status: "failed",
			provider: this.name,
			error: validation.errors?.join(", ")
		};
		try {
			const request = {
				from: message.from || this.defaultFrom,
				to: message.to,
				subject: message.subject,
				html: message.html,
				text: message.text,
				headers: message.headers
			};
			if (this.enableDkim && request.headers) request.headers["X-Cloudflare-DKIM"] = "enabled";
			const response = await this.binding.send(request);
			if (!response.success) return {
				messageId: "",
				status: "failed",
				provider: this.name,
				error: response.error || "Unknown error"
			};
			return {
				messageId: response.messageId || `cf-${Date.now()}`,
				status: "sent",
				provider: this.name
			};
		} catch (error) {
			return {
				messageId: "",
				status: "failed",
				provider: this.name,
				error: error instanceof Error ? error.message : "Unknown error"
			};
		}
	}
	async validateConfig() {
		const errors = [];
		if (!this.binding) errors.push("Cloudflare Email binding is not configured");
		if (!this.defaultFrom) errors.push("Default from address is required");
		else if (!this.validateEmail(this.defaultFrom)) errors.push("Default from address is invalid");
		return {
			valid: errors.length === 0,
			errors: errors.length > 0 ? errors : void 0
		};
	}
};
var ResendProvider = class extends BaseEmailProvider {
	constructor(apiKey, defaultFrom) {
		super();
		this.apiKey = apiKey;
		this.defaultFrom = defaultFrom;
		this.name = "resend";
		this.apiUrl = "https://api.resend.com/emails";
	}
	async send(message) {
		const validation = this.validateMessage(message);
		if (!validation.valid) return {
			messageId: "",
			status: "failed",
			provider: this.name,
			error: validation.errors?.join(", ")
		};
		try {
			const request = {
				from: message.from || this.defaultFrom,
				to: message.to,
				subject: message.subject,
				html: message.html,
				text: message.text
			};
			if (message.cc) request.cc = message.cc;
			if (message.bcc) request.bcc = message.bcc;
			if (message.replyTo) request.reply_to = message.replyTo;
			if (message.headers) request.headers = message.headers;
			if (message.attachments) request.attachments = message.attachments.map((att) => ({
				filename: att.filename,
				content: typeof att.content === "string" ? att.content : att.content.toString("base64")
			}));
			if (message.tags) request.tags = message.tags.map((tag) => ({
				name: tag,
				value: "true"
			}));
			const response = await fetch(this.apiUrl, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${this.apiKey}`,
					"Content-Type": "application/json"
				},
				body: JSON.stringify(request)
			});
			const data = await response.json();
			if (!response.ok || data.error) return {
				messageId: "",
				status: "failed",
				provider: this.name,
				error: data.error?.message || `HTTP ${response.status}`
			};
			return {
				messageId: data.id,
				status: "sent",
				provider: this.name
			};
		} catch (error) {
			return {
				messageId: "",
				status: "failed",
				provider: this.name,
				error: error instanceof Error ? error.message : "Unknown error"
			};
		}
	}
	async validateConfig() {
		const errors = [];
		if (!this.apiKey) errors.push("Resend API key is required");
		if (!this.defaultFrom) errors.push("Default from address is required");
		else if (!this.validateEmail(this.defaultFrom)) errors.push("Default from address is invalid");
		return {
			valid: errors.length === 0,
			errors: errors.length > 0 ? errors : void 0
		};
	}
};
var SmtpProvider = class extends BaseEmailProvider {
	constructor(config, defaultFrom) {
		super();
		this.config = config;
		this.defaultFrom = defaultFrom;
		this.name = "smtp";
	}
	async send(message) {
		const validation = this.validateMessage(message);
		if (!validation.valid) return {
			messageId: "",
			status: "failed",
			provider: this.name,
			error: validation.errors?.join(", ")
		};
		try {
			const from = message.from || this.defaultFrom;
			const to = this.normalizeRecipients(message.to);
			const messageId = `<${Date.now()}.${Math.random().toString(36)}@${from.split("@")[1]}>`;
			const headers = [
				`Message-ID: ${messageId}`,
				`From: ${from}`,
				`To: ${to.join(", ")}`,
				`Subject: ${message.subject}`,
				`Date: ${(/* @__PURE__ */ new Date()).toUTCString()}`,
				"MIME-Version: 1.0"
			];
			if (message.cc) headers.push(`Cc: ${this.normalizeRecipients(message.cc).join(", ")}`);
			if (message.bcc) headers.push(`Bcc: ${this.normalizeRecipients(message.bcc).join(", ")}`);
			if (message.replyTo) headers.push(`Reply-To: ${message.replyTo}`);
			if (message.headers) for (const [key, value] of Object.entries(message.headers)) headers.push(`${key}: ${value}`);
			let body = "";
			if (message.html && message.text) {
				const boundary = `boundary_${Date.now()}_${Math.random().toString(36)}`;
				headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
				body = [
					"",
					`--${boundary}`,
					"Content-Type: text/plain; charset=utf-8",
					"Content-Transfer-Encoding: quoted-printable",
					"",
					this.encodeQuotedPrintable(message.text),
					"",
					`--${boundary}`,
					"Content-Type: text/html; charset=utf-8",
					"Content-Transfer-Encoding: quoted-printable",
					"",
					this.encodeQuotedPrintable(message.html),
					"",
					`--${boundary}--`
				].join("\r\n");
			} else if (message.html) {
				headers.push("Content-Type: text/html; charset=utf-8");
				headers.push("Content-Transfer-Encoding: quoted-printable");
				body = "\r\n" + this.encodeQuotedPrintable(message.html);
			} else if (message.text) {
				headers.push("Content-Type: text/plain; charset=utf-8");
				headers.push("Content-Transfer-Encoding: quoted-printable");
				body = "\r\n" + this.encodeQuotedPrintable(message.text);
			}
			const response = await this.sendSmtp(from, to, headers.join("\r\n") + body);
			if (!response.success) return {
				messageId: "",
				status: "failed",
				provider: this.name,
				error: response.error || "SMTP send failed"
			};
			return {
				messageId: messageId.slice(1, -1),
				status: "sent",
				provider: this.name
			};
		} catch (error) {
			return {
				messageId: "",
				status: "failed",
				provider: this.name,
				error: error instanceof Error ? error.message : "Unknown error"
			};
		}
	}
	async validateConfig() {
		const errors = [];
		if (!this.config.host) errors.push("SMTP host is required");
		if (!this.config.port || this.config.port < 1 || this.config.port > 65535) errors.push("Valid SMTP port is required (1-65535)");
		if (!this.config.auth?.user) errors.push("SMTP username is required");
		if (!this.config.auth?.pass) errors.push("SMTP password is required");
		if (!this.defaultFrom) errors.push("Default from address is required");
		else if (!this.validateEmail(this.defaultFrom)) errors.push("Default from address is invalid");
		return {
			valid: errors.length === 0,
			errors: errors.length > 0 ? errors : void 0
		};
	}
	async sendSmtp(from, to, message) {
		try {
			const url = `${this.config.secure ? "smtps" : "smtp"}://${this.config.host}:${this.config.port}`;
			const response = await fetch(url, {
				method: "POST",
				headers: {
					"Content-Type": "message/rfc822",
					Authorization: `Basic ${btoa(`${this.config.auth.user}:${this.config.auth.pass}`)}`
				},
				body: `MAIL FROM:<${from}>\r\nRCPT TO:<${to.join(">,<")}>\r\nDATA\r\n${message}\r\n.\r\n`
			});
			if (!response.ok) return {
				success: false,
				error: `SMTP error: ${response.status} ${response.statusText}`
			};
			return { success: true };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown SMTP error"
			};
		}
	}
	encodeQuotedPrintable(text) {
		return text.replace(/[^\x20-\x7E]/g, (char) => {
			const hex = char.charCodeAt(0).toString(16).toUpperCase();
			return "=" + (hex.length === 1 ? "0" + hex : hex);
		}).replace(/=/g, "=3D").replace(/\r\n/g, "\n").split("\n").map((line) => {
			if (line.length <= 76) return line;
			const result = [];
			for (let i = 0; i < line.length; i += 75) result.push(line.slice(i, i + 75) + "=");
			return result.join("\r\n");
		}).join("\r\n");
	}
};
function createEmailProvider(config) {
	const from = config.from || "noreply@example.com";
	switch (config.provider) {
		case "cloudflare":
			if (!config.cloudflare?.binding) throw new Error("Cloudflare Email binding is required");
			return new CloudflareEmailProvider(config.cloudflare.binding, from, config.cloudflare.dkim ?? true);
		case "resend":
			if (!config.resend?.apiKey) throw new Error("Resend API key is required");
			return new ResendProvider(config.resend.apiKey, from);
		case "smtp":
			if (!config.smtp) throw new Error("SMTP configuration is required");
			return new SmtpProvider(config.smtp, from);
		default: throw new Error(`Unknown email provider: ${config.provider}`);
	}
}
var BaseTemplateEngine = class {
	async compile(template$1) {
		return template$1;
	}
	registerHelper(name, fn) {}
	registerPartial(name, template$1) {}
};
var SimpleTemplateEngine = class extends BaseTemplateEngine {
	constructor(..._args) {
		super(..._args);
		this.name = "simple";
		this.partials = /* @__PURE__ */ new Map();
	}
	setComponentLoader(loader) {
		this.componentLoader = loader;
	}
	registerPartial(name, content) {
		this.partials.set(name, content);
	}
	async render(template$1, context) {
		let result = template$1;
		const data = context.data !== void 0 ? context.data : context;
		const helpers = context.helpers;
		result = await this.processConditionalsRecursive(result, data, context);
		result = await this.processLoopsRecursive(result, data, context);
		result = await this.processPartials(result, {
			...context,
			data
		});
		result = result.replace(/\{\{(\s*[\w.]+\s*)\}\}/g, (match, key) => {
			const trimmedKey = key.trim();
			const value = this.resolveValue(data, trimmedKey);
			if (value === void 0) return "";
			if (value === null) return "null";
			return String(value);
		});
		if (helpers) result = this.processHelpers(result, helpers);
		return result;
	}
	async validate(template$1) {
		const errors = [];
		const openBraces = (template$1.match(/\{\{/g) || []).length;
		const closeBraces = (template$1.match(/\}\}/g) || []).length;
		if (openBraces !== closeBraces) errors.push(`Unbalanced braces: ${openBraces} opening {{ but ${closeBraces} closing }}`);
		const ifBlocks = (template$1.match(/\{\{#if\s+\w+\}\}/g) || []).length;
		const endifBlocks = (template$1.match(/\{\{\/if\}\}/g) || []).length;
		if (ifBlocks !== endifBlocks) errors.push(`Unbalanced conditionals: ${ifBlocks} {{#if}} but ${endifBlocks} {{/if}}`);
		const eachBlocks = (template$1.match(/\{\{#each\s+\w+\}\}/g) || []).length;
		const endEachBlocks = (template$1.match(/\{\{\/each\}\}/g) || []).length;
		if (eachBlocks !== endEachBlocks) errors.push(`Unbalanced loops: ${eachBlocks} {{#each}} but ${endEachBlocks} {{/each}}`);
		return {
			valid: errors.length === 0,
			errors: errors.length > 0 ? errors : void 0
		};
	}
	resolveValue(data, path$1) {
		const keys = path$1.split(".");
		let value = data;
		for (const key of keys) if (value && typeof value === "object" && key in value) value = value[key];
		else return;
		return value;
	}
	async processConditionalsRecursive(template$1, data, context) {
		const conditionalRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/;
		let result = template$1;
		let match;
		while ((match = conditionalRegex.exec(result)) !== null) {
			const [fullMatch, key, content] = match;
			const value = this.resolveValue(data, key);
			const elseMatch = content.match(/^([\s\S]*?)\{\{else\}\}([\s\S]*)$/);
			let selectedContent;
			if (elseMatch) {
				const [, ifContent, elseContent] = elseMatch;
				selectedContent = value ? ifContent : elseContent;
			} else selectedContent = value ? content : "";
			const rendered = await this.render(selectedContent, {
				...context,
				data
			});
			result = result.replace(fullMatch, rendered);
		}
		return result;
	}
	async processLoopsRecursive(template$1, data, context) {
		const loopRegex = /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/;
		let result = template$1;
		let match;
		while ((match = loopRegex.exec(result)) !== null) {
			const [fullMatch, key, content] = match;
			const array = this.resolveValue(data, key);
			if (!Array.isArray(array)) {
				result = result.replace(fullMatch, "");
				continue;
			}
			const renderedItems = await Promise.all(array.map(async (item, index) => {
				const itemData = typeof item === "object" && item !== null ? {
					...data,
					...item,
					"@index": index,
					"@first": index === 0,
					"@last": index === array.length - 1
				} : {
					...data,
					this: item,
					"@index": index,
					"@first": index === 0,
					"@last": index === array.length - 1
				};
				return await this.render(content, {
					...context,
					data: itemData
				});
			}));
			result = result.replace(fullMatch, renderedItems.join(""));
		}
		return result;
	}
	processConditionals(template$1, data) {
		return template$1.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, key, content) => {
			const value = this.resolveValue(data, key);
			const elseMatch = content.match(/^([\s\S]*?)\{\{else\}\}([\s\S]*)$/);
			if (elseMatch) {
				const [, ifContent, elseContent] = elseMatch;
				return value ? ifContent : elseContent;
			}
			return value ? content : "";
		});
	}
	processLoops(template$1, data) {
		return template$1.replace(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, key, content) => {
			const array = this.resolveValue(data, key);
			if (!Array.isArray(array)) return "";
			return array.map((item, index) => {
				let itemContent = content;
				itemContent = itemContent.replace(/\{\{this\}\}/g, String(item));
				itemContent = itemContent.replace(/\{\{@index\}\}/g, String(index));
				itemContent = itemContent.replace(/\{\{@first\}\}/g, String(index === 0));
				itemContent = itemContent.replace(/\{\{@last\}\}/g, String(index === array.length - 1));
				if (typeof item === "object" && item !== null) itemContent = itemContent.replace(/\{\{(\w+)\}\}/g, (m, k) => {
					const val = item[k];
					return val !== void 0 ? String(val) : m;
				});
				return itemContent;
			}).join("");
		});
	}
	async processPartials(template$1, context) {
		const matches = Array.from(template$1.matchAll(/\{\{>\s*([^}\s]+)(?:\s+([^}]+))?\s*\}\}/g));
		if (matches.length === 0) return template$1;
		let result = template$1;
		for (const match of matches) {
			const [fullMatch, partialRef, argsStr] = match;
			const partialData = argsStr ? this.parsePartialArgs(argsStr, context.data) : context.data;
			try {
				let partialContent;
				if (partialRef.includes("://")) {
					if (!this.componentLoader) throw new Error(`Component loader not configured. Cannot load component: ${partialRef}`);
					partialContent = await this.componentLoader.load(partialRef);
				} else {
					partialContent = this.partials.get(partialRef) || "";
					if (!partialContent) throw new Error(`Partial not found: ${partialRef}`);
				}
				const rendered = await this.render(partialContent, {
					...context,
					data: partialData
				});
				result = result.replace(fullMatch, rendered);
			} catch (error) {
				const errorMsg = error instanceof Error ? error.message : String(error);
				result = result.replace(fullMatch, `<!-- Partial error: ${errorMsg} -->`);
			}
		}
		return result;
	}
	parsePartialArgs(argsStr, contextData) {
		const args = { ...contextData };
		const argRegex = /(\w+)=(?:"([^"]*)"|'([^']*)'|(\S+))/g;
		let match;
		while ((match = argRegex.exec(argsStr)) !== null) {
			const [, key, quotedVal1, quotedVal2, unquotedVal] = match;
			const value = quotedVal1 || quotedVal2 || unquotedVal;
			if (value && !value.startsWith("\"") && !value.startsWith("'")) {
				const contextValue = this.resolveValue(contextData, value);
				args[key] = contextValue !== void 0 ? contextValue : value;
			} else args[key] = value;
		}
		return args;
	}
	processHelpers(template$1, helpers) {
		return template$1.replace(/\{\{(\w+)\s+([^}]+)\}\}/g, (match, helperName, args) => {
			const helper = helpers[helperName];
			if (!helper) return match;
			const parsedArgs = args.split(/\s+/);
			try {
				const result = helper(...parsedArgs);
				return String(result);
			} catch {
				return match;
			}
		});
	}
};
var require_utils = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.__esModule = true;
	exports.extend = extend;
	exports.indexOf = indexOf;
	exports.escapeExpression = escapeExpression;
	exports.isEmpty = isEmpty$1;
	exports.createFrame = createFrame;
	exports.blockParams = blockParams;
	exports.appendContextPath = appendContextPath;
	var escape$1 = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		"\"": "&quot;",
		"'": "&#x27;",
		"`": "&#x60;",
		"=": "&#x3D;"
	};
	var badChars = /[&<>"'`=]/g, possible = /[&<>"'`=]/;
	function escapeChar$1(chr) {
		return escape$1[chr];
	}
	function extend(obj) {
		for (var i = 1; i < arguments.length; i++) for (var key in arguments[i]) if (Object.prototype.hasOwnProperty.call(arguments[i], key)) obj[key] = arguments[i][key];
		return obj;
	}
	var toString$2 = Object.prototype.toString;
	exports.toString = toString$2;
	var isFunction$1 = function isFunction$2(value) {
		return typeof value === "function";
	};
	/* istanbul ignore next */
	if (isFunction$1(/x/)) exports.isFunction = isFunction$1 = function(value) {
		return typeof value === "function" && toString$2.call(value) === "[object Function]";
	};
	exports.isFunction = isFunction$1;
	/* istanbul ignore next */
	var isArray$1 = Array.isArray || function(value) {
		return value && typeof value === "object" ? toString$2.call(value) === "[object Array]" : false;
	};
	exports.isArray = isArray$1;
	function indexOf(array, value) {
		for (var i = 0, len = array.length; i < len; i++) if (array[i] === value) return i;
		return -1;
	}
	function escapeExpression(string$1) {
		if (typeof string$1 !== "string") {
			if (string$1 && string$1.toHTML) return string$1.toHTML();
			else if (string$1 == null) return "";
			else if (!string$1) return string$1 + "";
			string$1 = "" + string$1;
		}
		if (!possible.test(string$1)) return string$1;
		return string$1.replace(badChars, escapeChar$1);
	}
	function isEmpty$1(value) {
		if (!value && value !== 0) return true;
		else if (isArray$1(value) && value.length === 0) return true;
		else return false;
	}
	function createFrame(object) {
		var frame = extend({}, object);
		frame._parent = object;
		return frame;
	}
	function blockParams(params, ids) {
		params.path = ids;
		return params;
	}
	function appendContextPath(contextPath, id$1) {
		return (contextPath ? contextPath + "." : "") + id$1;
	}
}));
var require_exception = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	exports.__esModule = true;
	var errorProps = [
		"description",
		"fileName",
		"lineNumber",
		"endLineNumber",
		"message",
		"name",
		"number",
		"stack"
	];
	function Exception(message, node) {
		var loc = node && node.loc, line = void 0, endLineNumber = void 0, column = void 0, endColumn = void 0;
		if (loc) {
			line = loc.start.line;
			endLineNumber = loc.end.line;
			column = loc.start.column;
			endColumn = loc.end.column;
			message += " - " + line + ":" + column;
		}
		var tmp = Error.prototype.constructor.call(this, message);
		for (var idx = 0; idx < errorProps.length; idx++) this[errorProps[idx]] = tmp[errorProps[idx]];
		/* istanbul ignore else */
		if (Error.captureStackTrace) Error.captureStackTrace(this, Exception);
		try {
			if (loc) {
				this.lineNumber = line;
				this.endLineNumber = endLineNumber;
				/* istanbul ignore next */
				if (Object.defineProperty) {
					Object.defineProperty(this, "column", {
						value: column,
						enumerable: true
					});
					Object.defineProperty(this, "endColumn", {
						value: endColumn,
						enumerable: true
					});
				} else {
					this.column = column;
					this.endColumn = endColumn;
				}
			}
		} catch (nop) {}
	}
	Exception.prototype = /* @__PURE__ */ new Error();
	exports["default"] = Exception;
	module.exports = exports["default"];
}));
var require_block_helper_missing = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	exports.__esModule = true;
	var _utils$11 = require_utils();
	exports["default"] = function(instance) {
		instance.registerHelper("blockHelperMissing", function(context, options) {
			var inverse = options.inverse, fn = options.fn;
			if (context === true) return fn(this);
			else if (context === false || context == null) return inverse(this);
			else if (_utils$11.isArray(context)) if (context.length > 0) {
				if (options.ids) options.ids = [options.name];
				return instance.helpers.each(context, options);
			} else return inverse(this);
			else {
				if (options.data && options.ids) {
					var data = _utils$11.createFrame(options.data);
					data.contextPath = _utils$11.appendContextPath(options.data.contextPath, options.name);
					options = { data };
				}
				return fn(context, options);
			}
		});
	};
	module.exports = exports["default"];
}));
var require_each = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	exports.__esModule = true;
	// istanbul ignore next
	function _interopRequireDefault$17(obj) {
		return obj && obj.__esModule ? obj : { "default": obj };
	}
	var _utils$10 = require_utils();
	var _exception2$9 = _interopRequireDefault$17(require_exception());
	exports["default"] = function(instance) {
		instance.registerHelper("each", function(context, options) {
			if (!options) throw new _exception2$9["default"]("Must pass iterator to #each");
			var fn = options.fn, inverse = options.inverse, i = 0, ret = "", data = void 0, contextPath = void 0;
			if (options.data && options.ids) contextPath = _utils$10.appendContextPath(options.data.contextPath, options.ids[0]) + ".";
			if (_utils$10.isFunction(context)) context = context.call(this);
			if (options.data) data = _utils$10.createFrame(options.data);
			function execIteration(field, index, last$2) {
				if (data) {
					data.key = field;
					data.index = index;
					data.first = index === 0;
					data.last = !!last$2;
					if (contextPath) data.contextPath = contextPath + field;
				}
				ret = ret + fn(context[field], {
					data,
					blockParams: _utils$10.blockParams([context[field], field], [contextPath + field, null])
				});
			}
			if (context && typeof context === "object") if (_utils$10.isArray(context)) {
				for (var j = context.length; i < j; i++) if (i in context) execIteration(i, i, i === context.length - 1);
			} else if (typeof Symbol === "function" && context[Symbol.iterator]) {
				var newContext = [];
				var iterator = context[Symbol.iterator]();
				for (var it = iterator.next(); !it.done; it = iterator.next()) newContext.push(it.value);
				context = newContext;
				for (var j = context.length; i < j; i++) execIteration(i, i, i === context.length - 1);
			} else (function() {
				var priorKey = void 0;
				Object.keys(context).forEach(function(key) {
					if (priorKey !== void 0) execIteration(priorKey, i - 1);
					priorKey = key;
					i++;
				});
				if (priorKey !== void 0) execIteration(priorKey, i - 1, true);
			})();
			if (i === 0) ret = inverse(this);
			return ret;
		});
	};
	module.exports = exports["default"];
}));
var require_helper_missing = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	exports.__esModule = true;
	// istanbul ignore next
	function _interopRequireDefault$16(obj) {
		return obj && obj.__esModule ? obj : { "default": obj };
	}
	var _exception2$8 = _interopRequireDefault$16(require_exception());
	exports["default"] = function(instance) {
		instance.registerHelper("helperMissing", function() {
			if (arguments.length === 1) return;
			else throw new _exception2$8["default"]("Missing helper: \"" + arguments[arguments.length - 1].name + "\"");
		});
	};
	module.exports = exports["default"];
}));
var require_if = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	exports.__esModule = true;
	// istanbul ignore next
	function _interopRequireDefault$15(obj) {
		return obj && obj.__esModule ? obj : { "default": obj };
	}
	var _utils$9 = require_utils();
	var _exception2$7 = _interopRequireDefault$15(require_exception());
	exports["default"] = function(instance) {
		instance.registerHelper("if", function(conditional, options) {
			if (arguments.length != 2) throw new _exception2$7["default"]("#if requires exactly one argument");
			if (_utils$9.isFunction(conditional)) conditional = conditional.call(this);
			if (!options.hash.includeZero && !conditional || _utils$9.isEmpty(conditional)) return options.inverse(this);
			else return options.fn(this);
		});
		instance.registerHelper("unless", function(conditional, options) {
			if (arguments.length != 2) throw new _exception2$7["default"]("#unless requires exactly one argument");
			return instance.helpers["if"].call(this, conditional, {
				fn: options.inverse,
				inverse: options.fn,
				hash: options.hash
			});
		});
	};
	module.exports = exports["default"];
}));
var require_log = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	exports.__esModule = true;
	exports["default"] = function(instance) {
		instance.registerHelper("log", function() {
			var args = [void 0], options = arguments[arguments.length - 1];
			for (var i = 0; i < arguments.length - 1; i++) args.push(arguments[i]);
			var level = 1;
			if (options.hash.level != null) level = options.hash.level;
			else if (options.data && options.data.level != null) level = options.data.level;
			args[0] = level;
			instance.log.apply(instance, args);
		});
	};
	module.exports = exports["default"];
}));
var require_lookup = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	exports.__esModule = true;
	exports["default"] = function(instance) {
		instance.registerHelper("lookup", function(obj, field, options) {
			if (!obj) return obj;
			return options.lookupProperty(obj, field);
		});
	};
	module.exports = exports["default"];
}));
var require_with = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	exports.__esModule = true;
	// istanbul ignore next
	function _interopRequireDefault$14(obj) {
		return obj && obj.__esModule ? obj : { "default": obj };
	}
	var _utils$8 = require_utils();
	var _exception2$6 = _interopRequireDefault$14(require_exception());
	exports["default"] = function(instance) {
		instance.registerHelper("with", function(context, options) {
			if (arguments.length != 2) throw new _exception2$6["default"]("#with requires exactly one argument");
			if (_utils$8.isFunction(context)) context = context.call(this);
			var fn = options.fn;
			if (!_utils$8.isEmpty(context)) {
				var data = options.data;
				if (options.data && options.ids) {
					data = _utils$8.createFrame(options.data);
					data.contextPath = _utils$8.appendContextPath(options.data.contextPath, options.ids[0]);
				}
				return fn(context, {
					data,
					blockParams: _utils$8.blockParams([context], [data && data.contextPath])
				});
			} else return options.inverse(this);
		});
	};
	module.exports = exports["default"];
}));
var require_helpers$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.__esModule = true;
	exports.registerDefaultHelpers = registerDefaultHelpers;
	exports.moveHelperToHooks = moveHelperToHooks;
	// istanbul ignore next
	function _interopRequireDefault$13(obj) {
		return obj && obj.__esModule ? obj : { "default": obj };
	}
	var _helpersBlockHelperMissing2 = _interopRequireDefault$13(require_block_helper_missing());
	var _helpersEach2 = _interopRequireDefault$13(require_each());
	var _helpersHelperMissing2 = _interopRequireDefault$13(require_helper_missing());
	var _helpersIf2 = _interopRequireDefault$13(require_if());
	var _helpersLog2 = _interopRequireDefault$13(require_log());
	var _helpersLookup2 = _interopRequireDefault$13(require_lookup());
	var _helpersWith2 = _interopRequireDefault$13(require_with());
	function registerDefaultHelpers(instance) {
		_helpersBlockHelperMissing2["default"](instance);
		_helpersEach2["default"](instance);
		_helpersHelperMissing2["default"](instance);
		_helpersIf2["default"](instance);
		_helpersLog2["default"](instance);
		_helpersLookup2["default"](instance);
		_helpersWith2["default"](instance);
	}
	function moveHelperToHooks(instance, helperName, keepHelper) {
		if (instance.helpers[helperName]) {
			instance.hooks[helperName] = instance.helpers[helperName];
			if (!keepHelper) delete instance.helpers[helperName];
		}
	}
}));
var require_inline = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	exports.__esModule = true;
	var _utils$7 = require_utils();
	exports["default"] = function(instance) {
		instance.registerDecorator("inline", function(fn, props, container, options) {
			var ret = fn;
			if (!props.partials) {
				props.partials = {};
				ret = function(context, options$1) {
					var original = container.partials;
					container.partials = _utils$7.extend({}, original, props.partials);
					var ret$1 = fn(context, options$1);
					container.partials = original;
					return ret$1;
				};
			}
			props.partials[options.args[0]] = options.fn;
			return ret;
		});
	};
	module.exports = exports["default"];
}));
var require_decorators = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.__esModule = true;
	exports.registerDefaultDecorators = registerDefaultDecorators;
	// istanbul ignore next
	function _interopRequireDefault$12(obj) {
		return obj && obj.__esModule ? obj : { "default": obj };
	}
	var _decoratorsInline2 = _interopRequireDefault$12(require_inline());
	function registerDefaultDecorators(instance) {
		_decoratorsInline2["default"](instance);
	}
}));
var require_logger = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	exports.__esModule = true;
	var _utils$6 = require_utils();
	var logger$6 = {
		methodMap: [
			"debug",
			"info",
			"warn",
			"error"
		],
		level: "info",
		lookupLevel: function lookupLevel(level) {
			if (typeof level === "string") {
				var levelMap = _utils$6.indexOf(logger$6.methodMap, level.toLowerCase());
				if (levelMap >= 0) level = levelMap;
				else level = parseInt(level, 10);
			}
			return level;
		},
		log: function log$1(level) {
			level = logger$6.lookupLevel(level);
			if (typeof console !== "undefined" && logger$6.lookupLevel(logger$6.level) <= level) {
				var method = logger$6.methodMap[level];
				if (!console[method]) method = "log";
				for (var _len = arguments.length, message = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) message[_key - 1] = arguments[_key];
				console[method].apply(console, message);
			}
		}
	};
	exports["default"] = logger$6;
	module.exports = exports["default"];
}));
var require_create_new_lookup_object = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.__esModule = true;
	exports.createNewLookupObject = createNewLookupObject;
	var _utils$5 = require_utils();
	function createNewLookupObject() {
		for (var _len = arguments.length, sources = Array(_len), _key = 0; _key < _len; _key++) sources[_key] = arguments[_key];
		return _utils$5.extend.apply(void 0, [Object.create(null)].concat(sources));
	}
}));
var require_proto_access = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.__esModule = true;
	exports.createProtoAccessControl = createProtoAccessControl;
	exports.resultIsAllowed = resultIsAllowed;
	exports.resetLoggedProperties = resetLoggedProperties;
	// istanbul ignore next
	function _interopRequireDefault$11(obj) {
		return obj && obj.__esModule ? obj : { "default": obj };
	}
	var _createNewLookupObject = require_create_new_lookup_object();
	var _logger2$1 = _interopRequireDefault$11(require_logger());
	var loggedProperties = Object.create(null);
	function createProtoAccessControl(runtimeOptions) {
		var defaultMethodWhiteList = Object.create(null);
		defaultMethodWhiteList["constructor"] = false;
		defaultMethodWhiteList["__defineGetter__"] = false;
		defaultMethodWhiteList["__defineSetter__"] = false;
		defaultMethodWhiteList["__lookupGetter__"] = false;
		var defaultPropertyWhiteList = Object.create(null);
		defaultPropertyWhiteList["__proto__"] = false;
		return {
			properties: {
				whitelist: _createNewLookupObject.createNewLookupObject(defaultPropertyWhiteList, runtimeOptions.allowedProtoProperties),
				defaultValue: runtimeOptions.allowProtoPropertiesByDefault
			},
			methods: {
				whitelist: _createNewLookupObject.createNewLookupObject(defaultMethodWhiteList, runtimeOptions.allowedProtoMethods),
				defaultValue: runtimeOptions.allowProtoMethodsByDefault
			}
		};
	}
	function resultIsAllowed(result, protoAccessControl, propertyName) {
		if (typeof result === "function") return checkWhiteList(protoAccessControl.methods, propertyName);
		else return checkWhiteList(protoAccessControl.properties, propertyName);
	}
	function checkWhiteList(protoAccessControlForType, propertyName) {
		if (protoAccessControlForType.whitelist[propertyName] !== void 0) return protoAccessControlForType.whitelist[propertyName] === true;
		if (protoAccessControlForType.defaultValue !== void 0) return protoAccessControlForType.defaultValue;
		logUnexpecedPropertyAccessOnce(propertyName);
		return false;
	}
	function logUnexpecedPropertyAccessOnce(propertyName) {
		if (loggedProperties[propertyName] !== true) {
			loggedProperties[propertyName] = true;
			_logger2$1["default"].log("error", "Handlebars: Access has been denied to resolve the property \"" + propertyName + "\" because it is not an \"own property\" of its parent.\nYou can add a runtime option to disable the check or this warning:\nSee https://handlebarsjs.com/api-reference/runtime-options.html#options-to-control-prototype-access for details");
		}
	}
	function resetLoggedProperties() {
		Object.keys(loggedProperties).forEach(function(propertyName) {
			delete loggedProperties[propertyName];
		});
	}
}));
var require_base$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.__esModule = true;
	exports.HandlebarsEnvironment = HandlebarsEnvironment;
	// istanbul ignore next
	function _interopRequireDefault$10(obj) {
		return obj && obj.__esModule ? obj : { "default": obj };
	}
	var _utils$4 = require_utils();
	var _exception2$5 = _interopRequireDefault$10(require_exception());
	var _helpers$1 = require_helpers$1();
	var _decorators = require_decorators();
	var _logger2 = _interopRequireDefault$10(require_logger());
	var _internalProtoAccess$1 = require_proto_access();
	exports.VERSION = "4.7.8";
	exports.COMPILER_REVISION = 8;
	exports.LAST_COMPATIBLE_COMPILER_REVISION = 7;
	exports.REVISION_CHANGES = {
		1: "<= 1.0.rc.2",
		2: "== 1.0.0-rc.3",
		3: "== 1.0.0-rc.4",
		4: "== 1.x.x",
		5: "== 2.0.0-alpha.x",
		6: ">= 2.0.0-beta.1",
		7: ">= 4.0.0 <4.3.0",
		8: ">= 4.3.0"
	};
	var objectType = "[object Object]";
	function HandlebarsEnvironment(helpers, partials, decorators) {
		this.helpers = helpers || {};
		this.partials = partials || {};
		this.decorators = decorators || {};
		_helpers$1.registerDefaultHelpers(this);
		_decorators.registerDefaultDecorators(this);
	}
	HandlebarsEnvironment.prototype = {
		constructor: HandlebarsEnvironment,
		logger: _logger2["default"],
		log: _logger2["default"].log,
		registerHelper: function registerHelper(name, fn) {
			if (_utils$4.toString.call(name) === objectType) {
				if (fn) throw new _exception2$5["default"]("Arg not supported with multiple helpers");
				_utils$4.extend(this.helpers, name);
			} else this.helpers[name] = fn;
		},
		unregisterHelper: function unregisterHelper(name) {
			delete this.helpers[name];
		},
		registerPartial: function registerPartial(name, partial) {
			if (_utils$4.toString.call(name) === objectType) _utils$4.extend(this.partials, name);
			else {
				if (typeof partial === "undefined") throw new _exception2$5["default"]("Attempting to register a partial called \"" + name + "\" as undefined");
				this.partials[name] = partial;
			}
		},
		unregisterPartial: function unregisterPartial(name) {
			delete this.partials[name];
		},
		registerDecorator: function registerDecorator(name, fn) {
			if (_utils$4.toString.call(name) === objectType) {
				if (fn) throw new _exception2$5["default"]("Arg not supported with multiple decorators");
				_utils$4.extend(this.decorators, name);
			} else this.decorators[name] = fn;
		},
		unregisterDecorator: function unregisterDecorator(name) {
			delete this.decorators[name];
		},
		resetLoggedPropertyAccesses: function resetLoggedPropertyAccesses() {
			_internalProtoAccess$1.resetLoggedProperties();
		}
	};
	exports.log = _logger2["default"].log;
	exports.createFrame = _utils$4.createFrame;
	exports.logger = _logger2["default"];
}));
var require_safe_string = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	exports.__esModule = true;
	function SafeString(string$1) {
		this.string = string$1;
	}
	SafeString.prototype.toString = SafeString.prototype.toHTML = function() {
		return "" + this.string;
	};
	exports["default"] = SafeString;
	module.exports = exports["default"];
}));
var require_wrapHelper = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.__esModule = true;
	exports.wrapHelper = wrapHelper;
	function wrapHelper(helper, transformOptionsFn) {
		if (typeof helper !== "function") return helper;
		return function wrapper() {
			var options = arguments[arguments.length - 1];
			arguments[arguments.length - 1] = transformOptionsFn(options);
			return helper.apply(this, arguments);
		};
	}
}));
var require_runtime = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.__esModule = true;
	exports.checkRevision = checkRevision;
	exports.template = template;
	exports.wrapProgram = wrapProgram;
	exports.resolvePartial = resolvePartial;
	exports.invokePartial = invokePartial;
	exports.noop = noop;
	// istanbul ignore next
	function _interopRequireDefault$9(obj) {
		return obj && obj.__esModule ? obj : { "default": obj };
	}
	// istanbul ignore next
	function _interopRequireWildcard$2(obj) {
		if (obj && obj.__esModule) return obj;
		else {
			var newObj = {};
			if (obj != null) {
				for (var key in obj) if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
			}
			newObj["default"] = obj;
			return newObj;
		}
	}
	var Utils$1 = _interopRequireWildcard$2(require_utils());
	var _exception2$4 = _interopRequireDefault$9(require_exception());
	var _base$1 = require_base$1();
	var _helpers = require_helpers$1();
	var _internalWrapHelper = require_wrapHelper();
	var _internalProtoAccess = require_proto_access();
	function checkRevision(compilerInfo) {
		var compilerRevision = compilerInfo && compilerInfo[0] || 1, currentRevision = _base$1.COMPILER_REVISION;
		if (compilerRevision >= _base$1.LAST_COMPATIBLE_COMPILER_REVISION && compilerRevision <= _base$1.COMPILER_REVISION) return;
		if (compilerRevision < _base$1.LAST_COMPATIBLE_COMPILER_REVISION) {
			var runtimeVersions = _base$1.REVISION_CHANGES[currentRevision], compilerVersions = _base$1.REVISION_CHANGES[compilerRevision];
			throw new _exception2$4["default"]("Template was precompiled with an older version of Handlebars than the current runtime. Please update your precompiler to a newer version (" + runtimeVersions + ") or downgrade your runtime to an older version (" + compilerVersions + ").");
		} else throw new _exception2$4["default"]("Template was precompiled with a newer version of Handlebars than the current runtime. Please update your runtime to a newer version (" + compilerInfo[1] + ").");
	}
	function template(templateSpec, env) {
		/* istanbul ignore next */
		if (!env) throw new _exception2$4["default"]("No environment passed to template");
		if (!templateSpec || !templateSpec.main) throw new _exception2$4["default"]("Unknown template object: " + typeof templateSpec);
		templateSpec.main.decorator = templateSpec.main_d;
		env.VM.checkRevision(templateSpec.compiler);
		var templateWasPrecompiledWithCompilerV7 = templateSpec.compiler && templateSpec.compiler[0] === 7;
		function invokePartialWrapper(partial, context, options) {
			if (options.hash) {
				context = Utils$1.extend({}, context, options.hash);
				if (options.ids) options.ids[0] = true;
			}
			partial = env.VM.resolvePartial.call(this, partial, context, options);
			var extendedOptions = Utils$1.extend({}, options, {
				hooks: this.hooks,
				protoAccessControl: this.protoAccessControl
			});
			var result = env.VM.invokePartial.call(this, partial, context, extendedOptions);
			if (result == null && env.compile) {
				options.partials[options.name] = env.compile(partial, templateSpec.compilerOptions, env);
				result = options.partials[options.name](context, extendedOptions);
			}
			if (result != null) {
				if (options.indent) {
					var lines = result.split("\n");
					for (var i = 0, l = lines.length; i < l; i++) {
						if (!lines[i] && i + 1 === l) break;
						lines[i] = options.indent + lines[i];
					}
					result = lines.join("\n");
				}
				return result;
			} else throw new _exception2$4["default"]("The partial " + options.name + " could not be compiled when running in runtime-only mode");
		}
		var container = {
			strict: function strict(obj, name, loc) {
				if (!obj || !(name in obj)) throw new _exception2$4["default"]("\"" + name + "\" not defined in " + obj, { loc });
				return container.lookupProperty(obj, name);
			},
			lookupProperty: function lookupProperty(parent, propertyName) {
				var result = parent[propertyName];
				if (result == null) return result;
				if (Object.prototype.hasOwnProperty.call(parent, propertyName)) return result;
				if (_internalProtoAccess.resultIsAllowed(result, container.protoAccessControl, propertyName)) return result;
			},
			lookup: function lookup(depths, name) {
				var len = depths.length;
				for (var i = 0; i < len; i++) if ((depths[i] && container.lookupProperty(depths[i], name)) != null) return depths[i][name];
			},
			lambda: function lambda(current, context) {
				return typeof current === "function" ? current.call(context) : current;
			},
			escapeExpression: Utils$1.escapeExpression,
			invokePartial: invokePartialWrapper,
			fn: function fn(i) {
				var ret$1 = templateSpec[i];
				ret$1.decorator = templateSpec[i + "_d"];
				return ret$1;
			},
			programs: [],
			program: function program(i, data, declaredBlockParams, blockParams$1, depths) {
				var programWrapper = this.programs[i], fn = this.fn(i);
				if (data || depths || blockParams$1 || declaredBlockParams) programWrapper = wrapProgram(this, i, fn, data, declaredBlockParams, blockParams$1, depths);
				else if (!programWrapper) programWrapper = this.programs[i] = wrapProgram(this, i, fn);
				return programWrapper;
			},
			data: function data(value, depth) {
				while (value && depth--) value = value._parent;
				return value;
			},
			mergeIfNeeded: function mergeIfNeeded(param, common) {
				var obj = param || common;
				if (param && common && param !== common) obj = Utils$1.extend({}, common, param);
				return obj;
			},
			nullContext: Object.seal({}),
			noop: env.VM.noop,
			compilerInfo: templateSpec.compiler
		};
		function ret(context) {
			var options = arguments.length <= 1 || arguments[1] === void 0 ? {} : arguments[1];
			var data = options.data;
			ret._setup(options);
			if (!options.partial && templateSpec.useData) data = initData(context, data);
			var depths = void 0, blockParams$1 = templateSpec.useBlockParams ? [] : void 0;
			if (templateSpec.useDepths) if (options.depths) depths = context != options.depths[0] ? [context].concat(options.depths) : options.depths;
			else depths = [context];
			function main(context$1) {
				return "" + templateSpec.main(container, context$1, container.helpers, container.partials, data, blockParams$1, depths);
			}
			main = executeDecorators(templateSpec.main, main, container, options.depths || [], data, blockParams$1);
			return main(context, options);
		}
		ret.isTop = true;
		ret._setup = function(options) {
			if (!options.partial) {
				var mergedHelpers = Utils$1.extend({}, env.helpers, options.helpers);
				wrapHelpersToPassLookupProperty(mergedHelpers, container);
				container.helpers = mergedHelpers;
				if (templateSpec.usePartial) container.partials = container.mergeIfNeeded(options.partials, env.partials);
				if (templateSpec.usePartial || templateSpec.useDecorators) container.decorators = Utils$1.extend({}, env.decorators, options.decorators);
				container.hooks = {};
				container.protoAccessControl = _internalProtoAccess.createProtoAccessControl(options);
				var keepHelperInHelpers = options.allowCallsToHelperMissing || templateWasPrecompiledWithCompilerV7;
				_helpers.moveHelperToHooks(container, "helperMissing", keepHelperInHelpers);
				_helpers.moveHelperToHooks(container, "blockHelperMissing", keepHelperInHelpers);
			} else {
				container.protoAccessControl = options.protoAccessControl;
				container.helpers = options.helpers;
				container.partials = options.partials;
				container.decorators = options.decorators;
				container.hooks = options.hooks;
			}
		};
		ret._child = function(i, data, blockParams$1, depths) {
			if (templateSpec.useBlockParams && !blockParams$1) throw new _exception2$4["default"]("must pass block params");
			if (templateSpec.useDepths && !depths) throw new _exception2$4["default"]("must pass parent depths");
			return wrapProgram(container, i, templateSpec[i], data, 0, blockParams$1, depths);
		};
		return ret;
	}
	function wrapProgram(container, i, fn, data, declaredBlockParams, blockParams$1, depths) {
		function prog(context) {
			var options = arguments.length <= 1 || arguments[1] === void 0 ? {} : arguments[1];
			var currentDepths = depths;
			if (depths && context != depths[0] && !(context === container.nullContext && depths[0] === null)) currentDepths = [context].concat(depths);
			return fn(container, context, container.helpers, container.partials, options.data || data, blockParams$1 && [options.blockParams].concat(blockParams$1), currentDepths);
		}
		prog = executeDecorators(fn, prog, container, depths, data, blockParams$1);
		prog.program = i;
		prog.depth = depths ? depths.length : 0;
		prog.blockParams = declaredBlockParams || 0;
		return prog;
	}
	function resolvePartial(partial, context, options) {
		if (!partial) if (options.name === "@partial-block") partial = options.data["partial-block"];
		else partial = options.partials[options.name];
		else if (!partial.call && !options.name) {
			options.name = partial;
			partial = options.partials[partial];
		}
		return partial;
	}
	function invokePartial(partial, context, options) {
		var currentPartialBlock = options.data && options.data["partial-block"];
		options.partial = true;
		if (options.ids) options.data.contextPath = options.ids[0] || options.data.contextPath;
		var partialBlock = void 0;
		if (options.fn && options.fn !== noop) (function() {
			options.data = _base$1.createFrame(options.data);
			var fn = options.fn;
			partialBlock = options.data["partial-block"] = function partialBlockWrapper(context$1) {
				var options$1 = arguments.length <= 1 || arguments[1] === void 0 ? {} : arguments[1];
				options$1.data = _base$1.createFrame(options$1.data);
				options$1.data["partial-block"] = currentPartialBlock;
				return fn(context$1, options$1);
			};
			if (fn.partials) options.partials = Utils$1.extend({}, options.partials, fn.partials);
		})();
		if (partial === void 0 && partialBlock) partial = partialBlock;
		if (partial === void 0) throw new _exception2$4["default"]("The partial " + options.name + " could not be found");
		else if (partial instanceof Function) return partial(context, options);
	}
	function noop() {
		return "";
	}
	function initData(context, data) {
		if (!data || !("root" in data)) {
			data = data ? _base$1.createFrame(data) : {};
			data.root = context;
		}
		return data;
	}
	function executeDecorators(fn, prog, container, depths, data, blockParams$1) {
		if (fn.decorator) {
			var props = {};
			prog = fn.decorator(prog, props, container, depths && depths[0], data, blockParams$1, depths);
			Utils$1.extend(prog, props);
		}
		return prog;
	}
	function wrapHelpersToPassLookupProperty(mergedHelpers, container) {
		Object.keys(mergedHelpers).forEach(function(helperName) {
			var helper = mergedHelpers[helperName];
			mergedHelpers[helperName] = passLookupPropertyOption(helper, container);
		});
	}
	function passLookupPropertyOption(helper, container) {
		var lookupProperty = container.lookupProperty;
		return _internalWrapHelper.wrapHelper(helper, function(options) {
			return Utils$1.extend({ lookupProperty }, options);
		});
	}
}));
var require_no_conflict = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	exports.__esModule = true;
	exports["default"] = function(Handlebars) {
		/* istanbul ignore next */
		(function() {
			if (typeof globalThis === "object") return;
			Object.prototype.__defineGetter__("__magic__", function() {
				return this;
			});
			__magic__.globalThis = __magic__;
			delete Object.prototype.__magic__;
		})();
		var $Handlebars = globalThis.Handlebars;
		/* istanbul ignore next */
		Handlebars.noConflict = function() {
			if (globalThis.Handlebars === Handlebars) globalThis.Handlebars = $Handlebars;
			return Handlebars;
		};
	};
	module.exports = exports["default"];
}));
var require_handlebars_runtime = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	exports.__esModule = true;
	// istanbul ignore next
	function _interopRequireDefault$8(obj) {
		return obj && obj.__esModule ? obj : { "default": obj };
	}
	// istanbul ignore next
	function _interopRequireWildcard$1(obj) {
		if (obj && obj.__esModule) return obj;
		else {
			var newObj = {};
			if (obj != null) {
				for (var key in obj) if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
			}
			newObj["default"] = obj;
			return newObj;
		}
	}
	var base = _interopRequireWildcard$1(require_base$1());
	var _handlebarsSafeString2 = _interopRequireDefault$8(require_safe_string());
	var _handlebarsException2 = _interopRequireDefault$8(require_exception());
	var Utils = _interopRequireWildcard$1(require_utils());
	var runtime = _interopRequireWildcard$1(require_runtime());
	var _handlebarsNoConflict2$1 = _interopRequireDefault$8(require_no_conflict());
	function create$1() {
		var hb = new base.HandlebarsEnvironment();
		Utils.extend(hb, base);
		hb.SafeString = _handlebarsSafeString2["default"];
		hb.Exception = _handlebarsException2["default"];
		hb.Utils = Utils;
		hb.escapeExpression = Utils.escapeExpression;
		hb.VM = runtime;
		hb.template = function(spec) {
			return runtime.template(spec, hb);
		};
		return hb;
	}
	var inst$1 = create$1();
	inst$1.create = create$1;
	_handlebarsNoConflict2$1["default"](inst$1);
	inst$1["default"] = inst$1;
	exports["default"] = inst$1;
	module.exports = exports["default"];
}));
var require_ast = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	exports.__esModule = true;
	var AST = { helpers: {
		helperExpression: function helperExpression(node) {
			return node.type === "SubExpression" || (node.type === "MustacheStatement" || node.type === "BlockStatement") && !!(node.params && node.params.length || node.hash);
		},
		scopedId: function scopedId(path$1) {
			return /^\.|this\b/.test(path$1.original);
		},
		simpleId: function simpleId(path$1) {
			return path$1.parts.length === 1 && !AST.helpers.scopedId(path$1) && !path$1.depth;
		}
	} };
	exports["default"] = AST;
	module.exports = exports["default"];
}));
var require_parser = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	exports.__esModule = true;
	exports["default"] = (function() {
		var parser = {
			trace: function trace() {},
			yy: {},
			symbols_: {
				"error": 2,
				"root": 3,
				"program": 4,
				"EOF": 5,
				"program_repetition0": 6,
				"statement": 7,
				"mustache": 8,
				"block": 9,
				"rawBlock": 10,
				"partial": 11,
				"partialBlock": 12,
				"content": 13,
				"COMMENT": 14,
				"CONTENT": 15,
				"openRawBlock": 16,
				"rawBlock_repetition0": 17,
				"END_RAW_BLOCK": 18,
				"OPEN_RAW_BLOCK": 19,
				"helperName": 20,
				"openRawBlock_repetition0": 21,
				"openRawBlock_option0": 22,
				"CLOSE_RAW_BLOCK": 23,
				"openBlock": 24,
				"block_option0": 25,
				"closeBlock": 26,
				"openInverse": 27,
				"block_option1": 28,
				"OPEN_BLOCK": 29,
				"openBlock_repetition0": 30,
				"openBlock_option0": 31,
				"openBlock_option1": 32,
				"CLOSE": 33,
				"OPEN_INVERSE": 34,
				"openInverse_repetition0": 35,
				"openInverse_option0": 36,
				"openInverse_option1": 37,
				"openInverseChain": 38,
				"OPEN_INVERSE_CHAIN": 39,
				"openInverseChain_repetition0": 40,
				"openInverseChain_option0": 41,
				"openInverseChain_option1": 42,
				"inverseAndProgram": 43,
				"INVERSE": 44,
				"inverseChain": 45,
				"inverseChain_option0": 46,
				"OPEN_ENDBLOCK": 47,
				"OPEN": 48,
				"mustache_repetition0": 49,
				"mustache_option0": 50,
				"OPEN_UNESCAPED": 51,
				"mustache_repetition1": 52,
				"mustache_option1": 53,
				"CLOSE_UNESCAPED": 54,
				"OPEN_PARTIAL": 55,
				"partialName": 56,
				"partial_repetition0": 57,
				"partial_option0": 58,
				"openPartialBlock": 59,
				"OPEN_PARTIAL_BLOCK": 60,
				"openPartialBlock_repetition0": 61,
				"openPartialBlock_option0": 62,
				"param": 63,
				"sexpr": 64,
				"OPEN_SEXPR": 65,
				"sexpr_repetition0": 66,
				"sexpr_option0": 67,
				"CLOSE_SEXPR": 68,
				"hash": 69,
				"hash_repetition_plus0": 70,
				"hashSegment": 71,
				"ID": 72,
				"EQUALS": 73,
				"blockParams": 74,
				"OPEN_BLOCK_PARAMS": 75,
				"blockParams_repetition_plus0": 76,
				"CLOSE_BLOCK_PARAMS": 77,
				"path": 78,
				"dataName": 79,
				"STRING": 80,
				"NUMBER": 81,
				"BOOLEAN": 82,
				"UNDEFINED": 83,
				"NULL": 84,
				"DATA": 85,
				"pathSegments": 86,
				"SEP": 87,
				"$accept": 0,
				"$end": 1
			},
			terminals_: {
				2: "error",
				5: "EOF",
				14: "COMMENT",
				15: "CONTENT",
				18: "END_RAW_BLOCK",
				19: "OPEN_RAW_BLOCK",
				23: "CLOSE_RAW_BLOCK",
				29: "OPEN_BLOCK",
				33: "CLOSE",
				34: "OPEN_INVERSE",
				39: "OPEN_INVERSE_CHAIN",
				44: "INVERSE",
				47: "OPEN_ENDBLOCK",
				48: "OPEN",
				51: "OPEN_UNESCAPED",
				54: "CLOSE_UNESCAPED",
				55: "OPEN_PARTIAL",
				60: "OPEN_PARTIAL_BLOCK",
				65: "OPEN_SEXPR",
				68: "CLOSE_SEXPR",
				72: "ID",
				73: "EQUALS",
				75: "OPEN_BLOCK_PARAMS",
				77: "CLOSE_BLOCK_PARAMS",
				80: "STRING",
				81: "NUMBER",
				82: "BOOLEAN",
				83: "UNDEFINED",
				84: "NULL",
				85: "DATA",
				87: "SEP"
			},
			productions_: [
				0,
				[3, 2],
				[4, 1],
				[7, 1],
				[7, 1],
				[7, 1],
				[7, 1],
				[7, 1],
				[7, 1],
				[7, 1],
				[13, 1],
				[10, 3],
				[16, 5],
				[9, 4],
				[9, 4],
				[24, 6],
				[27, 6],
				[38, 6],
				[43, 2],
				[45, 3],
				[45, 1],
				[26, 3],
				[8, 5],
				[8, 5],
				[11, 5],
				[12, 3],
				[59, 5],
				[63, 1],
				[63, 1],
				[64, 5],
				[69, 1],
				[71, 3],
				[74, 3],
				[20, 1],
				[20, 1],
				[20, 1],
				[20, 1],
				[20, 1],
				[20, 1],
				[20, 1],
				[56, 1],
				[56, 1],
				[79, 2],
				[78, 1],
				[86, 3],
				[86, 1],
				[6, 0],
				[6, 2],
				[17, 0],
				[17, 2],
				[21, 0],
				[21, 2],
				[22, 0],
				[22, 1],
				[25, 0],
				[25, 1],
				[28, 0],
				[28, 1],
				[30, 0],
				[30, 2],
				[31, 0],
				[31, 1],
				[32, 0],
				[32, 1],
				[35, 0],
				[35, 2],
				[36, 0],
				[36, 1],
				[37, 0],
				[37, 1],
				[40, 0],
				[40, 2],
				[41, 0],
				[41, 1],
				[42, 0],
				[42, 1],
				[46, 0],
				[46, 1],
				[49, 0],
				[49, 2],
				[50, 0],
				[50, 1],
				[52, 0],
				[52, 2],
				[53, 0],
				[53, 1],
				[57, 0],
				[57, 2],
				[58, 0],
				[58, 1],
				[61, 0],
				[61, 2],
				[62, 0],
				[62, 1],
				[66, 0],
				[66, 2],
				[67, 0],
				[67, 1],
				[70, 1],
				[70, 2],
				[76, 1],
				[76, 2]
			],
			performAction: function anonymous(yytext, yyleng, yylineno, yy$1, yystate, $$, _$) {
				var $0 = $$.length - 1;
				switch (yystate) {
					case 1: return $$[$0 - 1];
					case 2:
						this.$ = yy$1.prepareProgram($$[$0]);
						break;
					case 3:
						this.$ = $$[$0];
						break;
					case 4:
						this.$ = $$[$0];
						break;
					case 5:
						this.$ = $$[$0];
						break;
					case 6:
						this.$ = $$[$0];
						break;
					case 7:
						this.$ = $$[$0];
						break;
					case 8:
						this.$ = $$[$0];
						break;
					case 9:
						this.$ = {
							type: "CommentStatement",
							value: yy$1.stripComment($$[$0]),
							strip: yy$1.stripFlags($$[$0], $$[$0]),
							loc: yy$1.locInfo(this._$)
						};
						break;
					case 10:
						this.$ = {
							type: "ContentStatement",
							original: $$[$0],
							value: $$[$0],
							loc: yy$1.locInfo(this._$)
						};
						break;
					case 11:
						this.$ = yy$1.prepareRawBlock($$[$0 - 2], $$[$0 - 1], $$[$0], this._$);
						break;
					case 12:
						this.$ = {
							path: $$[$0 - 3],
							params: $$[$0 - 2],
							hash: $$[$0 - 1]
						};
						break;
					case 13:
						this.$ = yy$1.prepareBlock($$[$0 - 3], $$[$0 - 2], $$[$0 - 1], $$[$0], false, this._$);
						break;
					case 14:
						this.$ = yy$1.prepareBlock($$[$0 - 3], $$[$0 - 2], $$[$0 - 1], $$[$0], true, this._$);
						break;
					case 15:
						this.$ = {
							open: $$[$0 - 5],
							path: $$[$0 - 4],
							params: $$[$0 - 3],
							hash: $$[$0 - 2],
							blockParams: $$[$0 - 1],
							strip: yy$1.stripFlags($$[$0 - 5], $$[$0])
						};
						break;
					case 16:
						this.$ = {
							path: $$[$0 - 4],
							params: $$[$0 - 3],
							hash: $$[$0 - 2],
							blockParams: $$[$0 - 1],
							strip: yy$1.stripFlags($$[$0 - 5], $$[$0])
						};
						break;
					case 17:
						this.$ = {
							path: $$[$0 - 4],
							params: $$[$0 - 3],
							hash: $$[$0 - 2],
							blockParams: $$[$0 - 1],
							strip: yy$1.stripFlags($$[$0 - 5], $$[$0])
						};
						break;
					case 18:
						this.$ = {
							strip: yy$1.stripFlags($$[$0 - 1], $$[$0 - 1]),
							program: $$[$0]
						};
						break;
					case 19:
						var inverse = yy$1.prepareBlock($$[$0 - 2], $$[$0 - 1], $$[$0], $$[$0], false, this._$), program = yy$1.prepareProgram([inverse], $$[$0 - 1].loc);
						program.chained = true;
						this.$ = {
							strip: $$[$0 - 2].strip,
							program,
							chain: true
						};
						break;
					case 20:
						this.$ = $$[$0];
						break;
					case 21:
						this.$ = {
							path: $$[$0 - 1],
							strip: yy$1.stripFlags($$[$0 - 2], $$[$0])
						};
						break;
					case 22:
						this.$ = yy$1.prepareMustache($$[$0 - 3], $$[$0 - 2], $$[$0 - 1], $$[$0 - 4], yy$1.stripFlags($$[$0 - 4], $$[$0]), this._$);
						break;
					case 23:
						this.$ = yy$1.prepareMustache($$[$0 - 3], $$[$0 - 2], $$[$0 - 1], $$[$0 - 4], yy$1.stripFlags($$[$0 - 4], $$[$0]), this._$);
						break;
					case 24:
						this.$ = {
							type: "PartialStatement",
							name: $$[$0 - 3],
							params: $$[$0 - 2],
							hash: $$[$0 - 1],
							indent: "",
							strip: yy$1.stripFlags($$[$0 - 4], $$[$0]),
							loc: yy$1.locInfo(this._$)
						};
						break;
					case 25:
						this.$ = yy$1.preparePartialBlock($$[$0 - 2], $$[$0 - 1], $$[$0], this._$);
						break;
					case 26:
						this.$ = {
							path: $$[$0 - 3],
							params: $$[$0 - 2],
							hash: $$[$0 - 1],
							strip: yy$1.stripFlags($$[$0 - 4], $$[$0])
						};
						break;
					case 27:
						this.$ = $$[$0];
						break;
					case 28:
						this.$ = $$[$0];
						break;
					case 29:
						this.$ = {
							type: "SubExpression",
							path: $$[$0 - 3],
							params: $$[$0 - 2],
							hash: $$[$0 - 1],
							loc: yy$1.locInfo(this._$)
						};
						break;
					case 30:
						this.$ = {
							type: "Hash",
							pairs: $$[$0],
							loc: yy$1.locInfo(this._$)
						};
						break;
					case 31:
						this.$ = {
							type: "HashPair",
							key: yy$1.id($$[$0 - 2]),
							value: $$[$0],
							loc: yy$1.locInfo(this._$)
						};
						break;
					case 32:
						this.$ = yy$1.id($$[$0 - 1]);
						break;
					case 33:
						this.$ = $$[$0];
						break;
					case 34:
						this.$ = $$[$0];
						break;
					case 35:
						this.$ = {
							type: "StringLiteral",
							value: $$[$0],
							original: $$[$0],
							loc: yy$1.locInfo(this._$)
						};
						break;
					case 36:
						this.$ = {
							type: "NumberLiteral",
							value: Number($$[$0]),
							original: Number($$[$0]),
							loc: yy$1.locInfo(this._$)
						};
						break;
					case 37:
						this.$ = {
							type: "BooleanLiteral",
							value: $$[$0] === "true",
							original: $$[$0] === "true",
							loc: yy$1.locInfo(this._$)
						};
						break;
					case 38:
						this.$ = {
							type: "UndefinedLiteral",
							original: void 0,
							value: void 0,
							loc: yy$1.locInfo(this._$)
						};
						break;
					case 39:
						this.$ = {
							type: "NullLiteral",
							original: null,
							value: null,
							loc: yy$1.locInfo(this._$)
						};
						break;
					case 40:
						this.$ = $$[$0];
						break;
					case 41:
						this.$ = $$[$0];
						break;
					case 42:
						this.$ = yy$1.preparePath(true, $$[$0], this._$);
						break;
					case 43:
						this.$ = yy$1.preparePath(false, $$[$0], this._$);
						break;
					case 44:
						$$[$0 - 2].push({
							part: yy$1.id($$[$0]),
							original: $$[$0],
							separator: $$[$0 - 1]
						});
						this.$ = $$[$0 - 2];
						break;
					case 45:
						this.$ = [{
							part: yy$1.id($$[$0]),
							original: $$[$0]
						}];
						break;
					case 46:
						this.$ = [];
						break;
					case 47:
						$$[$0 - 1].push($$[$0]);
						break;
					case 48:
						this.$ = [];
						break;
					case 49:
						$$[$0 - 1].push($$[$0]);
						break;
					case 50:
						this.$ = [];
						break;
					case 51:
						$$[$0 - 1].push($$[$0]);
						break;
					case 58:
						this.$ = [];
						break;
					case 59:
						$$[$0 - 1].push($$[$0]);
						break;
					case 64:
						this.$ = [];
						break;
					case 65:
						$$[$0 - 1].push($$[$0]);
						break;
					case 70:
						this.$ = [];
						break;
					case 71:
						$$[$0 - 1].push($$[$0]);
						break;
					case 78:
						this.$ = [];
						break;
					case 79:
						$$[$0 - 1].push($$[$0]);
						break;
					case 82:
						this.$ = [];
						break;
					case 83:
						$$[$0 - 1].push($$[$0]);
						break;
					case 86:
						this.$ = [];
						break;
					case 87:
						$$[$0 - 1].push($$[$0]);
						break;
					case 90:
						this.$ = [];
						break;
					case 91:
						$$[$0 - 1].push($$[$0]);
						break;
					case 94:
						this.$ = [];
						break;
					case 95:
						$$[$0 - 1].push($$[$0]);
						break;
					case 98:
						this.$ = [$$[$0]];
						break;
					case 99:
						$$[$0 - 1].push($$[$0]);
						break;
					case 100:
						this.$ = [$$[$0]];
						break;
					case 101:
						$$[$0 - 1].push($$[$0]);
						break;
				}
			},
			table: [
				{
					3: 1,
					4: 2,
					5: [2, 46],
					6: 3,
					14: [2, 46],
					15: [2, 46],
					19: [2, 46],
					29: [2, 46],
					34: [2, 46],
					48: [2, 46],
					51: [2, 46],
					55: [2, 46],
					60: [2, 46]
				},
				{ 1: [3] },
				{ 5: [1, 4] },
				{
					5: [2, 2],
					7: 5,
					8: 6,
					9: 7,
					10: 8,
					11: 9,
					12: 10,
					13: 11,
					14: [1, 12],
					15: [1, 20],
					16: 17,
					19: [1, 23],
					24: 15,
					27: 16,
					29: [1, 21],
					34: [1, 22],
					39: [2, 2],
					44: [2, 2],
					47: [2, 2],
					48: [1, 13],
					51: [1, 14],
					55: [1, 18],
					59: 19,
					60: [1, 24]
				},
				{ 1: [2, 1] },
				{
					5: [2, 47],
					14: [2, 47],
					15: [2, 47],
					19: [2, 47],
					29: [2, 47],
					34: [2, 47],
					39: [2, 47],
					44: [2, 47],
					47: [2, 47],
					48: [2, 47],
					51: [2, 47],
					55: [2, 47],
					60: [2, 47]
				},
				{
					5: [2, 3],
					14: [2, 3],
					15: [2, 3],
					19: [2, 3],
					29: [2, 3],
					34: [2, 3],
					39: [2, 3],
					44: [2, 3],
					47: [2, 3],
					48: [2, 3],
					51: [2, 3],
					55: [2, 3],
					60: [2, 3]
				},
				{
					5: [2, 4],
					14: [2, 4],
					15: [2, 4],
					19: [2, 4],
					29: [2, 4],
					34: [2, 4],
					39: [2, 4],
					44: [2, 4],
					47: [2, 4],
					48: [2, 4],
					51: [2, 4],
					55: [2, 4],
					60: [2, 4]
				},
				{
					5: [2, 5],
					14: [2, 5],
					15: [2, 5],
					19: [2, 5],
					29: [2, 5],
					34: [2, 5],
					39: [2, 5],
					44: [2, 5],
					47: [2, 5],
					48: [2, 5],
					51: [2, 5],
					55: [2, 5],
					60: [2, 5]
				},
				{
					5: [2, 6],
					14: [2, 6],
					15: [2, 6],
					19: [2, 6],
					29: [2, 6],
					34: [2, 6],
					39: [2, 6],
					44: [2, 6],
					47: [2, 6],
					48: [2, 6],
					51: [2, 6],
					55: [2, 6],
					60: [2, 6]
				},
				{
					5: [2, 7],
					14: [2, 7],
					15: [2, 7],
					19: [2, 7],
					29: [2, 7],
					34: [2, 7],
					39: [2, 7],
					44: [2, 7],
					47: [2, 7],
					48: [2, 7],
					51: [2, 7],
					55: [2, 7],
					60: [2, 7]
				},
				{
					5: [2, 8],
					14: [2, 8],
					15: [2, 8],
					19: [2, 8],
					29: [2, 8],
					34: [2, 8],
					39: [2, 8],
					44: [2, 8],
					47: [2, 8],
					48: [2, 8],
					51: [2, 8],
					55: [2, 8],
					60: [2, 8]
				},
				{
					5: [2, 9],
					14: [2, 9],
					15: [2, 9],
					19: [2, 9],
					29: [2, 9],
					34: [2, 9],
					39: [2, 9],
					44: [2, 9],
					47: [2, 9],
					48: [2, 9],
					51: [2, 9],
					55: [2, 9],
					60: [2, 9]
				},
				{
					20: 25,
					72: [1, 35],
					78: 26,
					79: 27,
					80: [1, 28],
					81: [1, 29],
					82: [1, 30],
					83: [1, 31],
					84: [1, 32],
					85: [1, 34],
					86: 33
				},
				{
					20: 36,
					72: [1, 35],
					78: 26,
					79: 27,
					80: [1, 28],
					81: [1, 29],
					82: [1, 30],
					83: [1, 31],
					84: [1, 32],
					85: [1, 34],
					86: 33
				},
				{
					4: 37,
					6: 3,
					14: [2, 46],
					15: [2, 46],
					19: [2, 46],
					29: [2, 46],
					34: [2, 46],
					39: [2, 46],
					44: [2, 46],
					47: [2, 46],
					48: [2, 46],
					51: [2, 46],
					55: [2, 46],
					60: [2, 46]
				},
				{
					4: 38,
					6: 3,
					14: [2, 46],
					15: [2, 46],
					19: [2, 46],
					29: [2, 46],
					34: [2, 46],
					44: [2, 46],
					47: [2, 46],
					48: [2, 46],
					51: [2, 46],
					55: [2, 46],
					60: [2, 46]
				},
				{
					15: [2, 48],
					17: 39,
					18: [2, 48]
				},
				{
					20: 41,
					56: 40,
					64: 42,
					65: [1, 43],
					72: [1, 35],
					78: 26,
					79: 27,
					80: [1, 28],
					81: [1, 29],
					82: [1, 30],
					83: [1, 31],
					84: [1, 32],
					85: [1, 34],
					86: 33
				},
				{
					4: 44,
					6: 3,
					14: [2, 46],
					15: [2, 46],
					19: [2, 46],
					29: [2, 46],
					34: [2, 46],
					47: [2, 46],
					48: [2, 46],
					51: [2, 46],
					55: [2, 46],
					60: [2, 46]
				},
				{
					5: [2, 10],
					14: [2, 10],
					15: [2, 10],
					18: [2, 10],
					19: [2, 10],
					29: [2, 10],
					34: [2, 10],
					39: [2, 10],
					44: [2, 10],
					47: [2, 10],
					48: [2, 10],
					51: [2, 10],
					55: [2, 10],
					60: [2, 10]
				},
				{
					20: 45,
					72: [1, 35],
					78: 26,
					79: 27,
					80: [1, 28],
					81: [1, 29],
					82: [1, 30],
					83: [1, 31],
					84: [1, 32],
					85: [1, 34],
					86: 33
				},
				{
					20: 46,
					72: [1, 35],
					78: 26,
					79: 27,
					80: [1, 28],
					81: [1, 29],
					82: [1, 30],
					83: [1, 31],
					84: [1, 32],
					85: [1, 34],
					86: 33
				},
				{
					20: 47,
					72: [1, 35],
					78: 26,
					79: 27,
					80: [1, 28],
					81: [1, 29],
					82: [1, 30],
					83: [1, 31],
					84: [1, 32],
					85: [1, 34],
					86: 33
				},
				{
					20: 41,
					56: 48,
					64: 42,
					65: [1, 43],
					72: [1, 35],
					78: 26,
					79: 27,
					80: [1, 28],
					81: [1, 29],
					82: [1, 30],
					83: [1, 31],
					84: [1, 32],
					85: [1, 34],
					86: 33
				},
				{
					33: [2, 78],
					49: 49,
					65: [2, 78],
					72: [2, 78],
					80: [2, 78],
					81: [2, 78],
					82: [2, 78],
					83: [2, 78],
					84: [2, 78],
					85: [2, 78]
				},
				{
					23: [2, 33],
					33: [2, 33],
					54: [2, 33],
					65: [2, 33],
					68: [2, 33],
					72: [2, 33],
					75: [2, 33],
					80: [2, 33],
					81: [2, 33],
					82: [2, 33],
					83: [2, 33],
					84: [2, 33],
					85: [2, 33]
				},
				{
					23: [2, 34],
					33: [2, 34],
					54: [2, 34],
					65: [2, 34],
					68: [2, 34],
					72: [2, 34],
					75: [2, 34],
					80: [2, 34],
					81: [2, 34],
					82: [2, 34],
					83: [2, 34],
					84: [2, 34],
					85: [2, 34]
				},
				{
					23: [2, 35],
					33: [2, 35],
					54: [2, 35],
					65: [2, 35],
					68: [2, 35],
					72: [2, 35],
					75: [2, 35],
					80: [2, 35],
					81: [2, 35],
					82: [2, 35],
					83: [2, 35],
					84: [2, 35],
					85: [2, 35]
				},
				{
					23: [2, 36],
					33: [2, 36],
					54: [2, 36],
					65: [2, 36],
					68: [2, 36],
					72: [2, 36],
					75: [2, 36],
					80: [2, 36],
					81: [2, 36],
					82: [2, 36],
					83: [2, 36],
					84: [2, 36],
					85: [2, 36]
				},
				{
					23: [2, 37],
					33: [2, 37],
					54: [2, 37],
					65: [2, 37],
					68: [2, 37],
					72: [2, 37],
					75: [2, 37],
					80: [2, 37],
					81: [2, 37],
					82: [2, 37],
					83: [2, 37],
					84: [2, 37],
					85: [2, 37]
				},
				{
					23: [2, 38],
					33: [2, 38],
					54: [2, 38],
					65: [2, 38],
					68: [2, 38],
					72: [2, 38],
					75: [2, 38],
					80: [2, 38],
					81: [2, 38],
					82: [2, 38],
					83: [2, 38],
					84: [2, 38],
					85: [2, 38]
				},
				{
					23: [2, 39],
					33: [2, 39],
					54: [2, 39],
					65: [2, 39],
					68: [2, 39],
					72: [2, 39],
					75: [2, 39],
					80: [2, 39],
					81: [2, 39],
					82: [2, 39],
					83: [2, 39],
					84: [2, 39],
					85: [2, 39]
				},
				{
					23: [2, 43],
					33: [2, 43],
					54: [2, 43],
					65: [2, 43],
					68: [2, 43],
					72: [2, 43],
					75: [2, 43],
					80: [2, 43],
					81: [2, 43],
					82: [2, 43],
					83: [2, 43],
					84: [2, 43],
					85: [2, 43],
					87: [1, 50]
				},
				{
					72: [1, 35],
					86: 51
				},
				{
					23: [2, 45],
					33: [2, 45],
					54: [2, 45],
					65: [2, 45],
					68: [2, 45],
					72: [2, 45],
					75: [2, 45],
					80: [2, 45],
					81: [2, 45],
					82: [2, 45],
					83: [2, 45],
					84: [2, 45],
					85: [2, 45],
					87: [2, 45]
				},
				{
					52: 52,
					54: [2, 82],
					65: [2, 82],
					72: [2, 82],
					80: [2, 82],
					81: [2, 82],
					82: [2, 82],
					83: [2, 82],
					84: [2, 82],
					85: [2, 82]
				},
				{
					25: 53,
					38: 55,
					39: [1, 57],
					43: 56,
					44: [1, 58],
					45: 54,
					47: [2, 54]
				},
				{
					28: 59,
					43: 60,
					44: [1, 58],
					47: [2, 56]
				},
				{
					13: 62,
					15: [1, 20],
					18: [1, 61]
				},
				{
					33: [2, 86],
					57: 63,
					65: [2, 86],
					72: [2, 86],
					80: [2, 86],
					81: [2, 86],
					82: [2, 86],
					83: [2, 86],
					84: [2, 86],
					85: [2, 86]
				},
				{
					33: [2, 40],
					65: [2, 40],
					72: [2, 40],
					80: [2, 40],
					81: [2, 40],
					82: [2, 40],
					83: [2, 40],
					84: [2, 40],
					85: [2, 40]
				},
				{
					33: [2, 41],
					65: [2, 41],
					72: [2, 41],
					80: [2, 41],
					81: [2, 41],
					82: [2, 41],
					83: [2, 41],
					84: [2, 41],
					85: [2, 41]
				},
				{
					20: 64,
					72: [1, 35],
					78: 26,
					79: 27,
					80: [1, 28],
					81: [1, 29],
					82: [1, 30],
					83: [1, 31],
					84: [1, 32],
					85: [1, 34],
					86: 33
				},
				{
					26: 65,
					47: [1, 66]
				},
				{
					30: 67,
					33: [2, 58],
					65: [2, 58],
					72: [2, 58],
					75: [2, 58],
					80: [2, 58],
					81: [2, 58],
					82: [2, 58],
					83: [2, 58],
					84: [2, 58],
					85: [2, 58]
				},
				{
					33: [2, 64],
					35: 68,
					65: [2, 64],
					72: [2, 64],
					75: [2, 64],
					80: [2, 64],
					81: [2, 64],
					82: [2, 64],
					83: [2, 64],
					84: [2, 64],
					85: [2, 64]
				},
				{
					21: 69,
					23: [2, 50],
					65: [2, 50],
					72: [2, 50],
					80: [2, 50],
					81: [2, 50],
					82: [2, 50],
					83: [2, 50],
					84: [2, 50],
					85: [2, 50]
				},
				{
					33: [2, 90],
					61: 70,
					65: [2, 90],
					72: [2, 90],
					80: [2, 90],
					81: [2, 90],
					82: [2, 90],
					83: [2, 90],
					84: [2, 90],
					85: [2, 90]
				},
				{
					20: 74,
					33: [2, 80],
					50: 71,
					63: 72,
					64: 75,
					65: [1, 43],
					69: 73,
					70: 76,
					71: 77,
					72: [1, 78],
					78: 26,
					79: 27,
					80: [1, 28],
					81: [1, 29],
					82: [1, 30],
					83: [1, 31],
					84: [1, 32],
					85: [1, 34],
					86: 33
				},
				{ 72: [1, 79] },
				{
					23: [2, 42],
					33: [2, 42],
					54: [2, 42],
					65: [2, 42],
					68: [2, 42],
					72: [2, 42],
					75: [2, 42],
					80: [2, 42],
					81: [2, 42],
					82: [2, 42],
					83: [2, 42],
					84: [2, 42],
					85: [2, 42],
					87: [1, 50]
				},
				{
					20: 74,
					53: 80,
					54: [2, 84],
					63: 81,
					64: 75,
					65: [1, 43],
					69: 82,
					70: 76,
					71: 77,
					72: [1, 78],
					78: 26,
					79: 27,
					80: [1, 28],
					81: [1, 29],
					82: [1, 30],
					83: [1, 31],
					84: [1, 32],
					85: [1, 34],
					86: 33
				},
				{
					26: 83,
					47: [1, 66]
				},
				{ 47: [2, 55] },
				{
					4: 84,
					6: 3,
					14: [2, 46],
					15: [2, 46],
					19: [2, 46],
					29: [2, 46],
					34: [2, 46],
					39: [2, 46],
					44: [2, 46],
					47: [2, 46],
					48: [2, 46],
					51: [2, 46],
					55: [2, 46],
					60: [2, 46]
				},
				{ 47: [2, 20] },
				{
					20: 85,
					72: [1, 35],
					78: 26,
					79: 27,
					80: [1, 28],
					81: [1, 29],
					82: [1, 30],
					83: [1, 31],
					84: [1, 32],
					85: [1, 34],
					86: 33
				},
				{
					4: 86,
					6: 3,
					14: [2, 46],
					15: [2, 46],
					19: [2, 46],
					29: [2, 46],
					34: [2, 46],
					47: [2, 46],
					48: [2, 46],
					51: [2, 46],
					55: [2, 46],
					60: [2, 46]
				},
				{
					26: 87,
					47: [1, 66]
				},
				{ 47: [2, 57] },
				{
					5: [2, 11],
					14: [2, 11],
					15: [2, 11],
					19: [2, 11],
					29: [2, 11],
					34: [2, 11],
					39: [2, 11],
					44: [2, 11],
					47: [2, 11],
					48: [2, 11],
					51: [2, 11],
					55: [2, 11],
					60: [2, 11]
				},
				{
					15: [2, 49],
					18: [2, 49]
				},
				{
					20: 74,
					33: [2, 88],
					58: 88,
					63: 89,
					64: 75,
					65: [1, 43],
					69: 90,
					70: 76,
					71: 77,
					72: [1, 78],
					78: 26,
					79: 27,
					80: [1, 28],
					81: [1, 29],
					82: [1, 30],
					83: [1, 31],
					84: [1, 32],
					85: [1, 34],
					86: 33
				},
				{
					65: [2, 94],
					66: 91,
					68: [2, 94],
					72: [2, 94],
					80: [2, 94],
					81: [2, 94],
					82: [2, 94],
					83: [2, 94],
					84: [2, 94],
					85: [2, 94]
				},
				{
					5: [2, 25],
					14: [2, 25],
					15: [2, 25],
					19: [2, 25],
					29: [2, 25],
					34: [2, 25],
					39: [2, 25],
					44: [2, 25],
					47: [2, 25],
					48: [2, 25],
					51: [2, 25],
					55: [2, 25],
					60: [2, 25]
				},
				{
					20: 92,
					72: [1, 35],
					78: 26,
					79: 27,
					80: [1, 28],
					81: [1, 29],
					82: [1, 30],
					83: [1, 31],
					84: [1, 32],
					85: [1, 34],
					86: 33
				},
				{
					20: 74,
					31: 93,
					33: [2, 60],
					63: 94,
					64: 75,
					65: [1, 43],
					69: 95,
					70: 76,
					71: 77,
					72: [1, 78],
					75: [2, 60],
					78: 26,
					79: 27,
					80: [1, 28],
					81: [1, 29],
					82: [1, 30],
					83: [1, 31],
					84: [1, 32],
					85: [1, 34],
					86: 33
				},
				{
					20: 74,
					33: [2, 66],
					36: 96,
					63: 97,
					64: 75,
					65: [1, 43],
					69: 98,
					70: 76,
					71: 77,
					72: [1, 78],
					75: [2, 66],
					78: 26,
					79: 27,
					80: [1, 28],
					81: [1, 29],
					82: [1, 30],
					83: [1, 31],
					84: [1, 32],
					85: [1, 34],
					86: 33
				},
				{
					20: 74,
					22: 99,
					23: [2, 52],
					63: 100,
					64: 75,
					65: [1, 43],
					69: 101,
					70: 76,
					71: 77,
					72: [1, 78],
					78: 26,
					79: 27,
					80: [1, 28],
					81: [1, 29],
					82: [1, 30],
					83: [1, 31],
					84: [1, 32],
					85: [1, 34],
					86: 33
				},
				{
					20: 74,
					33: [2, 92],
					62: 102,
					63: 103,
					64: 75,
					65: [1, 43],
					69: 104,
					70: 76,
					71: 77,
					72: [1, 78],
					78: 26,
					79: 27,
					80: [1, 28],
					81: [1, 29],
					82: [1, 30],
					83: [1, 31],
					84: [1, 32],
					85: [1, 34],
					86: 33
				},
				{ 33: [1, 105] },
				{
					33: [2, 79],
					65: [2, 79],
					72: [2, 79],
					80: [2, 79],
					81: [2, 79],
					82: [2, 79],
					83: [2, 79],
					84: [2, 79],
					85: [2, 79]
				},
				{ 33: [2, 81] },
				{
					23: [2, 27],
					33: [2, 27],
					54: [2, 27],
					65: [2, 27],
					68: [2, 27],
					72: [2, 27],
					75: [2, 27],
					80: [2, 27],
					81: [2, 27],
					82: [2, 27],
					83: [2, 27],
					84: [2, 27],
					85: [2, 27]
				},
				{
					23: [2, 28],
					33: [2, 28],
					54: [2, 28],
					65: [2, 28],
					68: [2, 28],
					72: [2, 28],
					75: [2, 28],
					80: [2, 28],
					81: [2, 28],
					82: [2, 28],
					83: [2, 28],
					84: [2, 28],
					85: [2, 28]
				},
				{
					23: [2, 30],
					33: [2, 30],
					54: [2, 30],
					68: [2, 30],
					71: 106,
					72: [1, 107],
					75: [2, 30]
				},
				{
					23: [2, 98],
					33: [2, 98],
					54: [2, 98],
					68: [2, 98],
					72: [2, 98],
					75: [2, 98]
				},
				{
					23: [2, 45],
					33: [2, 45],
					54: [2, 45],
					65: [2, 45],
					68: [2, 45],
					72: [2, 45],
					73: [1, 108],
					75: [2, 45],
					80: [2, 45],
					81: [2, 45],
					82: [2, 45],
					83: [2, 45],
					84: [2, 45],
					85: [2, 45],
					87: [2, 45]
				},
				{
					23: [2, 44],
					33: [2, 44],
					54: [2, 44],
					65: [2, 44],
					68: [2, 44],
					72: [2, 44],
					75: [2, 44],
					80: [2, 44],
					81: [2, 44],
					82: [2, 44],
					83: [2, 44],
					84: [2, 44],
					85: [2, 44],
					87: [2, 44]
				},
				{ 54: [1, 109] },
				{
					54: [2, 83],
					65: [2, 83],
					72: [2, 83],
					80: [2, 83],
					81: [2, 83],
					82: [2, 83],
					83: [2, 83],
					84: [2, 83],
					85: [2, 83]
				},
				{ 54: [2, 85] },
				{
					5: [2, 13],
					14: [2, 13],
					15: [2, 13],
					19: [2, 13],
					29: [2, 13],
					34: [2, 13],
					39: [2, 13],
					44: [2, 13],
					47: [2, 13],
					48: [2, 13],
					51: [2, 13],
					55: [2, 13],
					60: [2, 13]
				},
				{
					38: 55,
					39: [1, 57],
					43: 56,
					44: [1, 58],
					45: 111,
					46: 110,
					47: [2, 76]
				},
				{
					33: [2, 70],
					40: 112,
					65: [2, 70],
					72: [2, 70],
					75: [2, 70],
					80: [2, 70],
					81: [2, 70],
					82: [2, 70],
					83: [2, 70],
					84: [2, 70],
					85: [2, 70]
				},
				{ 47: [2, 18] },
				{
					5: [2, 14],
					14: [2, 14],
					15: [2, 14],
					19: [2, 14],
					29: [2, 14],
					34: [2, 14],
					39: [2, 14],
					44: [2, 14],
					47: [2, 14],
					48: [2, 14],
					51: [2, 14],
					55: [2, 14],
					60: [2, 14]
				},
				{ 33: [1, 113] },
				{
					33: [2, 87],
					65: [2, 87],
					72: [2, 87],
					80: [2, 87],
					81: [2, 87],
					82: [2, 87],
					83: [2, 87],
					84: [2, 87],
					85: [2, 87]
				},
				{ 33: [2, 89] },
				{
					20: 74,
					63: 115,
					64: 75,
					65: [1, 43],
					67: 114,
					68: [2, 96],
					69: 116,
					70: 76,
					71: 77,
					72: [1, 78],
					78: 26,
					79: 27,
					80: [1, 28],
					81: [1, 29],
					82: [1, 30],
					83: [1, 31],
					84: [1, 32],
					85: [1, 34],
					86: 33
				},
				{ 33: [1, 117] },
				{
					32: 118,
					33: [2, 62],
					74: 119,
					75: [1, 120]
				},
				{
					33: [2, 59],
					65: [2, 59],
					72: [2, 59],
					75: [2, 59],
					80: [2, 59],
					81: [2, 59],
					82: [2, 59],
					83: [2, 59],
					84: [2, 59],
					85: [2, 59]
				},
				{
					33: [2, 61],
					75: [2, 61]
				},
				{
					33: [2, 68],
					37: 121,
					74: 122,
					75: [1, 120]
				},
				{
					33: [2, 65],
					65: [2, 65],
					72: [2, 65],
					75: [2, 65],
					80: [2, 65],
					81: [2, 65],
					82: [2, 65],
					83: [2, 65],
					84: [2, 65],
					85: [2, 65]
				},
				{
					33: [2, 67],
					75: [2, 67]
				},
				{ 23: [1, 123] },
				{
					23: [2, 51],
					65: [2, 51],
					72: [2, 51],
					80: [2, 51],
					81: [2, 51],
					82: [2, 51],
					83: [2, 51],
					84: [2, 51],
					85: [2, 51]
				},
				{ 23: [2, 53] },
				{ 33: [1, 124] },
				{
					33: [2, 91],
					65: [2, 91],
					72: [2, 91],
					80: [2, 91],
					81: [2, 91],
					82: [2, 91],
					83: [2, 91],
					84: [2, 91],
					85: [2, 91]
				},
				{ 33: [2, 93] },
				{
					5: [2, 22],
					14: [2, 22],
					15: [2, 22],
					19: [2, 22],
					29: [2, 22],
					34: [2, 22],
					39: [2, 22],
					44: [2, 22],
					47: [2, 22],
					48: [2, 22],
					51: [2, 22],
					55: [2, 22],
					60: [2, 22]
				},
				{
					23: [2, 99],
					33: [2, 99],
					54: [2, 99],
					68: [2, 99],
					72: [2, 99],
					75: [2, 99]
				},
				{ 73: [1, 108] },
				{
					20: 74,
					63: 125,
					64: 75,
					65: [1, 43],
					72: [1, 35],
					78: 26,
					79: 27,
					80: [1, 28],
					81: [1, 29],
					82: [1, 30],
					83: [1, 31],
					84: [1, 32],
					85: [1, 34],
					86: 33
				},
				{
					5: [2, 23],
					14: [2, 23],
					15: [2, 23],
					19: [2, 23],
					29: [2, 23],
					34: [2, 23],
					39: [2, 23],
					44: [2, 23],
					47: [2, 23],
					48: [2, 23],
					51: [2, 23],
					55: [2, 23],
					60: [2, 23]
				},
				{ 47: [2, 19] },
				{ 47: [2, 77] },
				{
					20: 74,
					33: [2, 72],
					41: 126,
					63: 127,
					64: 75,
					65: [1, 43],
					69: 128,
					70: 76,
					71: 77,
					72: [1, 78],
					75: [2, 72],
					78: 26,
					79: 27,
					80: [1, 28],
					81: [1, 29],
					82: [1, 30],
					83: [1, 31],
					84: [1, 32],
					85: [1, 34],
					86: 33
				},
				{
					5: [2, 24],
					14: [2, 24],
					15: [2, 24],
					19: [2, 24],
					29: [2, 24],
					34: [2, 24],
					39: [2, 24],
					44: [2, 24],
					47: [2, 24],
					48: [2, 24],
					51: [2, 24],
					55: [2, 24],
					60: [2, 24]
				},
				{ 68: [1, 129] },
				{
					65: [2, 95],
					68: [2, 95],
					72: [2, 95],
					80: [2, 95],
					81: [2, 95],
					82: [2, 95],
					83: [2, 95],
					84: [2, 95],
					85: [2, 95]
				},
				{ 68: [2, 97] },
				{
					5: [2, 21],
					14: [2, 21],
					15: [2, 21],
					19: [2, 21],
					29: [2, 21],
					34: [2, 21],
					39: [2, 21],
					44: [2, 21],
					47: [2, 21],
					48: [2, 21],
					51: [2, 21],
					55: [2, 21],
					60: [2, 21]
				},
				{ 33: [1, 130] },
				{ 33: [2, 63] },
				{
					72: [1, 132],
					76: 131
				},
				{ 33: [1, 133] },
				{ 33: [2, 69] },
				{
					15: [2, 12],
					18: [2, 12]
				},
				{
					14: [2, 26],
					15: [2, 26],
					19: [2, 26],
					29: [2, 26],
					34: [2, 26],
					47: [2, 26],
					48: [2, 26],
					51: [2, 26],
					55: [2, 26],
					60: [2, 26]
				},
				{
					23: [2, 31],
					33: [2, 31],
					54: [2, 31],
					68: [2, 31],
					72: [2, 31],
					75: [2, 31]
				},
				{
					33: [2, 74],
					42: 134,
					74: 135,
					75: [1, 120]
				},
				{
					33: [2, 71],
					65: [2, 71],
					72: [2, 71],
					75: [2, 71],
					80: [2, 71],
					81: [2, 71],
					82: [2, 71],
					83: [2, 71],
					84: [2, 71],
					85: [2, 71]
				},
				{
					33: [2, 73],
					75: [2, 73]
				},
				{
					23: [2, 29],
					33: [2, 29],
					54: [2, 29],
					65: [2, 29],
					68: [2, 29],
					72: [2, 29],
					75: [2, 29],
					80: [2, 29],
					81: [2, 29],
					82: [2, 29],
					83: [2, 29],
					84: [2, 29],
					85: [2, 29]
				},
				{
					14: [2, 15],
					15: [2, 15],
					19: [2, 15],
					29: [2, 15],
					34: [2, 15],
					39: [2, 15],
					44: [2, 15],
					47: [2, 15],
					48: [2, 15],
					51: [2, 15],
					55: [2, 15],
					60: [2, 15]
				},
				{
					72: [1, 137],
					77: [1, 136]
				},
				{
					72: [2, 100],
					77: [2, 100]
				},
				{
					14: [2, 16],
					15: [2, 16],
					19: [2, 16],
					29: [2, 16],
					34: [2, 16],
					44: [2, 16],
					47: [2, 16],
					48: [2, 16],
					51: [2, 16],
					55: [2, 16],
					60: [2, 16]
				},
				{ 33: [1, 138] },
				{ 33: [2, 75] },
				{ 33: [2, 32] },
				{
					72: [2, 101],
					77: [2, 101]
				},
				{
					14: [2, 17],
					15: [2, 17],
					19: [2, 17],
					29: [2, 17],
					34: [2, 17],
					39: [2, 17],
					44: [2, 17],
					47: [2, 17],
					48: [2, 17],
					51: [2, 17],
					55: [2, 17],
					60: [2, 17]
				}
			],
			defaultActions: {
				4: [2, 1],
				54: [2, 55],
				56: [2, 20],
				60: [2, 57],
				73: [2, 81],
				82: [2, 85],
				86: [2, 18],
				90: [2, 89],
				101: [2, 53],
				104: [2, 93],
				110: [2, 19],
				111: [2, 77],
				116: [2, 97],
				119: [2, 63],
				122: [2, 69],
				135: [2, 75],
				136: [2, 32]
			},
			parseError: function parseError(str, hash) {
				throw new Error(str);
			},
			parse: function parse$2(input) {
				var self = this, stack = [0], vstack = [null], lstack = [], table = this.table, yytext = "", yylineno = 0, yyleng = 0, recovering = 0;
				this.lexer.setInput(input);
				this.lexer.yy = this.yy;
				this.yy.lexer = this.lexer;
				this.yy.parser = this;
				if (typeof this.lexer.yylloc == "undefined") this.lexer.yylloc = {};
				var yyloc = this.lexer.yylloc;
				lstack.push(yyloc);
				var ranges = this.lexer.options && this.lexer.options.ranges;
				if (typeof this.yy.parseError === "function") this.parseError = this.yy.parseError;
				function lex() {
					var token = self.lexer.lex() || 1;
					if (typeof token !== "number") token = self.symbols_[token] || token;
					return token;
				}
				var symbol, preErrorSymbol, state, action, r, yyval = {}, p, len, newState, expected;
				while (true) {
					state = stack[stack.length - 1];
					if (this.defaultActions[state]) action = this.defaultActions[state];
					else {
						if (symbol === null || typeof symbol == "undefined") symbol = lex();
						action = table[state] && table[state][symbol];
					}
					if (typeof action === "undefined" || !action.length || !action[0]) {
						var errStr = "";
						if (!recovering) {
							expected = [];
							for (p in table[state]) if (this.terminals_[p] && p > 2) expected.push("'" + this.terminals_[p] + "'");
							if (this.lexer.showPosition) errStr = "Parse error on line " + (yylineno + 1) + ":\n" + this.lexer.showPosition() + "\nExpecting " + expected.join(", ") + ", got '" + (this.terminals_[symbol] || symbol) + "'";
							else errStr = "Parse error on line " + (yylineno + 1) + ": Unexpected " + (symbol == 1 ? "end of input" : "'" + (this.terminals_[symbol] || symbol) + "'");
							this.parseError(errStr, {
								text: this.lexer.match,
								token: this.terminals_[symbol] || symbol,
								line: this.lexer.yylineno,
								loc: yyloc,
								expected
							});
						}
					}
					if (action[0] instanceof Array && action.length > 1) throw new Error("Parse Error: multiple actions possible at state: " + state + ", token: " + symbol);
					switch (action[0]) {
						case 1:
							stack.push(symbol);
							vstack.push(this.lexer.yytext);
							lstack.push(this.lexer.yylloc);
							stack.push(action[1]);
							symbol = null;
							if (!preErrorSymbol) {
								yyleng = this.lexer.yyleng;
								yytext = this.lexer.yytext;
								yylineno = this.lexer.yylineno;
								yyloc = this.lexer.yylloc;
								if (recovering > 0) recovering--;
							} else {
								symbol = preErrorSymbol;
								preErrorSymbol = null;
							}
							break;
						case 2:
							len = this.productions_[action[1]][1];
							yyval.$ = vstack[vstack.length - len];
							yyval._$ = {
								first_line: lstack[lstack.length - (len || 1)].first_line,
								last_line: lstack[lstack.length - 1].last_line,
								first_column: lstack[lstack.length - (len || 1)].first_column,
								last_column: lstack[lstack.length - 1].last_column
							};
							if (ranges) yyval._$.range = [lstack[lstack.length - (len || 1)].range[0], lstack[lstack.length - 1].range[1]];
							r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);
							if (typeof r !== "undefined") return r;
							if (len) {
								stack = stack.slice(0, -1 * len * 2);
								vstack = vstack.slice(0, -1 * len);
								lstack = lstack.slice(0, -1 * len);
							}
							stack.push(this.productions_[action[1]][0]);
							vstack.push(yyval.$);
							lstack.push(yyval._$);
							newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
							stack.push(newState);
							break;
						case 3: return true;
					}
				}
				return true;
			}
		};
		parser.lexer = (function() {
			var lexer = {
				EOF: 1,
				parseError: function parseError(str, hash) {
					if (this.yy.parser) this.yy.parser.parseError(str, hash);
					else throw new Error(str);
				},
				setInput: function setInput(input) {
					this._input = input;
					this._more = this._less = this.done = false;
					this.yylineno = this.yyleng = 0;
					this.yytext = this.matched = this.match = "";
					this.conditionStack = ["INITIAL"];
					this.yylloc = {
						first_line: 1,
						first_column: 0,
						last_line: 1,
						last_column: 0
					};
					if (this.options.ranges) this.yylloc.range = [0, 0];
					this.offset = 0;
					return this;
				},
				input: function input() {
					var ch = this._input[0];
					this.yytext += ch;
					this.yyleng++;
					this.offset++;
					this.match += ch;
					this.matched += ch;
					if (ch.match(/(?:\r\n?|\n).*/g)) {
						this.yylineno++;
						this.yylloc.last_line++;
					} else this.yylloc.last_column++;
					if (this.options.ranges) this.yylloc.range[1]++;
					this._input = this._input.slice(1);
					return ch;
				},
				unput: function unput(ch) {
					var len = ch.length;
					var lines = ch.split(/(?:\r\n?|\n)/g);
					this._input = ch + this._input;
					this.yytext = this.yytext.substr(0, this.yytext.length - len - 1);
					this.offset -= len;
					var oldLines = this.match.split(/(?:\r\n?|\n)/g);
					this.match = this.match.substr(0, this.match.length - 1);
					this.matched = this.matched.substr(0, this.matched.length - 1);
					if (lines.length - 1) this.yylineno -= lines.length - 1;
					var r = this.yylloc.range;
					this.yylloc = {
						first_line: this.yylloc.first_line,
						last_line: this.yylineno + 1,
						first_column: this.yylloc.first_column,
						last_column: lines ? (lines.length === oldLines.length ? this.yylloc.first_column : 0) + oldLines[oldLines.length - lines.length].length - lines[0].length : this.yylloc.first_column - len
					};
					if (this.options.ranges) this.yylloc.range = [r[0], r[0] + this.yyleng - len];
					return this;
				},
				more: function more() {
					this._more = true;
					return this;
				},
				less: function less(n) {
					this.unput(this.match.slice(n));
				},
				pastInput: function pastInput() {
					var past = this.matched.substr(0, this.matched.length - this.match.length);
					return (past.length > 20 ? "..." : "") + past.substr(-20).replace(/\n/g, "");
				},
				upcomingInput: function upcomingInput() {
					var next = this.match;
					if (next.length < 20) next += this._input.substr(0, 20 - next.length);
					return (next.substr(0, 20) + (next.length > 20 ? "..." : "")).replace(/\n/g, "");
				},
				showPosition: function showPosition() {
					var pre = this.pastInput();
					var c = new Array(pre.length + 1).join("-");
					return pre + this.upcomingInput() + "\n" + c + "^";
				},
				next: function next() {
					if (this.done) return this.EOF;
					if (!this._input) this.done = true;
					var token, match, tempMatch, index, lines;
					if (!this._more) {
						this.yytext = "";
						this.match = "";
					}
					var rules = this._currentRules();
					for (var i = 0; i < rules.length; i++) {
						tempMatch = this._input.match(this.rules[rules[i]]);
						if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
							match = tempMatch;
							index = i;
							if (!this.options.flex) break;
						}
					}
					if (match) {
						lines = match[0].match(/(?:\r\n?|\n).*/g);
						if (lines) this.yylineno += lines.length;
						this.yylloc = {
							first_line: this.yylloc.last_line,
							last_line: this.yylineno + 1,
							first_column: this.yylloc.last_column,
							last_column: lines ? lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length : this.yylloc.last_column + match[0].length
						};
						this.yytext += match[0];
						this.match += match[0];
						this.matches = match;
						this.yyleng = this.yytext.length;
						if (this.options.ranges) this.yylloc.range = [this.offset, this.offset += this.yyleng];
						this._more = false;
						this._input = this._input.slice(match[0].length);
						this.matched += match[0];
						token = this.performAction.call(this, this.yy, this, rules[index], this.conditionStack[this.conditionStack.length - 1]);
						if (this.done && this._input) this.done = false;
						if (token) return token;
						else return;
					}
					if (this._input === "") return this.EOF;
					else return this.parseError("Lexical error on line " + (this.yylineno + 1) + ". Unrecognized text.\n" + this.showPosition(), {
						text: "",
						token: null,
						line: this.yylineno
					});
				},
				lex: function lex() {
					var r = this.next();
					if (typeof r !== "undefined") return r;
					else return this.lex();
				},
				begin: function begin(condition) {
					this.conditionStack.push(condition);
				},
				popState: function popState() {
					return this.conditionStack.pop();
				},
				_currentRules: function _currentRules() {
					return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
				},
				topState: function topState() {
					return this.conditionStack[this.conditionStack.length - 2];
				},
				pushState: function begin(condition) {
					this.begin(condition);
				}
			};
			lexer.options = {};
			lexer.performAction = function anonymous(yy$1, yy_, $avoiding_name_collisions, YY_START) {
				function strip$1(start, end) {
					return yy_.yytext = yy_.yytext.substring(start, yy_.yyleng - end + start);
				}
				switch ($avoiding_name_collisions) {
					case 0:
						if (yy_.yytext.slice(-2) === "\\\\") {
							strip$1(0, 1);
							this.begin("mu");
						} else if (yy_.yytext.slice(-1) === "\\") {
							strip$1(0, 1);
							this.begin("emu");
						} else this.begin("mu");
						if (yy_.yytext) return 15;
						break;
					case 1: return 15;
					case 2:
						this.popState();
						return 15;
					case 3:
						this.begin("raw");
						return 15;
					case 4:
						this.popState();
						if (this.conditionStack[this.conditionStack.length - 1] === "raw") return 15;
						else {
							strip$1(5, 9);
							return "END_RAW_BLOCK";
						}
						break;
					case 5: return 15;
					case 6:
						this.popState();
						return 14;
					case 7: return 65;
					case 8: return 68;
					case 9: return 19;
					case 10:
						this.popState();
						this.begin("raw");
						return 23;
					case 11: return 55;
					case 12: return 60;
					case 13: return 29;
					case 14: return 47;
					case 15:
						this.popState();
						return 44;
					case 16:
						this.popState();
						return 44;
					case 17: return 34;
					case 18: return 39;
					case 19: return 51;
					case 20: return 48;
					case 21:
						this.unput(yy_.yytext);
						this.popState();
						this.begin("com");
						break;
					case 22:
						this.popState();
						return 14;
					case 23: return 48;
					case 24: return 73;
					case 25: return 72;
					case 26: return 72;
					case 27: return 87;
					case 28: break;
					case 29:
						this.popState();
						return 54;
					case 30:
						this.popState();
						return 33;
					case 31:
						yy_.yytext = strip$1(1, 2).replace(/\\"/g, "\"");
						return 80;
					case 32:
						yy_.yytext = strip$1(1, 2).replace(/\\'/g, "'");
						return 80;
					case 33: return 85;
					case 34: return 82;
					case 35: return 82;
					case 36: return 83;
					case 37: return 84;
					case 38: return 81;
					case 39: return 75;
					case 40: return 77;
					case 41: return 72;
					case 42:
						yy_.yytext = yy_.yytext.replace(/\\([\\\]])/g, "$1");
						return 72;
					case 43: return "INVALID";
					case 44: return 5;
				}
			};
			lexer.rules = [
				/^(?:[^\x00]*?(?=(\{\{)))/,
				/^(?:[^\x00]+)/,
				/^(?:[^\x00]{2,}?(?=(\{\{|\\\{\{|\\\\\{\{|$)))/,
				/^(?:\{\{\{\{(?=[^/]))/,
				/^(?:\{\{\{\{\/[^\s!"#%-,\.\/;->@\[-\^`\{-~]+(?=[=}\s\/.])\}\}\}\})/,
				/^(?:[^\x00]+?(?=(\{\{\{\{)))/,
				/^(?:[\s\S]*?--(~)?\}\})/,
				/^(?:\()/,
				/^(?:\))/,
				/^(?:\{\{\{\{)/,
				/^(?:\}\}\}\})/,
				/^(?:\{\{(~)?>)/,
				/^(?:\{\{(~)?#>)/,
				/^(?:\{\{(~)?#\*?)/,
				/^(?:\{\{(~)?\/)/,
				/^(?:\{\{(~)?\^\s*(~)?\}\})/,
				/^(?:\{\{(~)?\s*else\s*(~)?\}\})/,
				/^(?:\{\{(~)?\^)/,
				/^(?:\{\{(~)?\s*else\b)/,
				/^(?:\{\{(~)?\{)/,
				/^(?:\{\{(~)?&)/,
				/^(?:\{\{(~)?!--)/,
				/^(?:\{\{(~)?![\s\S]*?\}\})/,
				/^(?:\{\{(~)?\*?)/,
				/^(?:=)/,
				/^(?:\.\.)/,
				/^(?:\.(?=([=~}\s\/.)|])))/,
				/^(?:[\/.])/,
				/^(?:\s+)/,
				/^(?:\}(~)?\}\})/,
				/^(?:(~)?\}\})/,
				/^(?:"(\\["]|[^"])*")/,
				/^(?:'(\\[']|[^'])*')/,
				/^(?:@)/,
				/^(?:true(?=([~}\s)])))/,
				/^(?:false(?=([~}\s)])))/,
				/^(?:undefined(?=([~}\s)])))/,
				/^(?:null(?=([~}\s)])))/,
				/^(?:-?[0-9]+(?:\.[0-9]+)?(?=([~}\s)])))/,
				/^(?:as\s+\|)/,
				/^(?:\|)/,
				/^(?:([^\s!"#%-,\.\/;->@\[-\^`\{-~]+(?=([=~}\s\/.)|]))))/,
				/^(?:\[(\\\]|[^\]])*\])/,
				/^(?:.)/,
				/^(?:$)/
			];
			lexer.conditions = {
				"mu": {
					"rules": [
						7,
						8,
						9,
						10,
						11,
						12,
						13,
						14,
						15,
						16,
						17,
						18,
						19,
						20,
						21,
						22,
						23,
						24,
						25,
						26,
						27,
						28,
						29,
						30,
						31,
						32,
						33,
						34,
						35,
						36,
						37,
						38,
						39,
						40,
						41,
						42,
						43,
						44
					],
					"inclusive": false
				},
				"emu": {
					"rules": [2],
					"inclusive": false
				},
				"com": {
					"rules": [6],
					"inclusive": false
				},
				"raw": {
					"rules": [
						3,
						4,
						5
					],
					"inclusive": false
				},
				"INITIAL": {
					"rules": [
						0,
						1,
						44
					],
					"inclusive": true
				}
			};
			return lexer;
		})();
		function Parser$3() {
			this.yy = {};
		}
		Parser$3.prototype = parser;
		parser.Parser = Parser$3;
		return new Parser$3();
	})();
	module.exports = exports["default"];
}));
var require_visitor = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	exports.__esModule = true;
	// istanbul ignore next
	function _interopRequireDefault$7(obj) {
		return obj && obj.__esModule ? obj : { "default": obj };
	}
	var _exception2$3 = _interopRequireDefault$7(require_exception());
	function Visitor() {
		this.parents = [];
	}
	Visitor.prototype = {
		constructor: Visitor,
		mutating: false,
		acceptKey: function acceptKey(node, name) {
			var value = this.accept(node[name]);
			if (this.mutating) {
				if (value && !Visitor.prototype[value.type]) throw new _exception2$3["default"]("Unexpected node type \"" + value.type + "\" found when accepting " + name + " on " + node.type);
				node[name] = value;
			}
		},
		acceptRequired: function acceptRequired(node, name) {
			this.acceptKey(node, name);
			if (!node[name]) throw new _exception2$3["default"](node.type + " requires " + name);
		},
		acceptArray: function acceptArray(array) {
			for (var i = 0, l = array.length; i < l; i++) {
				this.acceptKey(array, i);
				if (!array[i]) {
					array.splice(i, 1);
					i--;
					l--;
				}
			}
		},
		accept: function accept(object) {
			if (!object) return;
			/* istanbul ignore next: Sanity code */
			if (!this[object.type]) throw new _exception2$3["default"]("Unknown type: " + object.type, object);
			if (this.current) this.parents.unshift(this.current);
			this.current = object;
			var ret = this[object.type](object);
			this.current = this.parents.shift();
			if (!this.mutating || ret) return ret;
			else if (ret !== false) return object;
		},
		Program: function Program(program) {
			this.acceptArray(program.body);
		},
		MustacheStatement: visitSubExpression,
		Decorator: visitSubExpression,
		BlockStatement: visitBlock,
		DecoratorBlock: visitBlock,
		PartialStatement: visitPartial,
		PartialBlockStatement: function PartialBlockStatement(partial) {
			visitPartial.call(this, partial);
			this.acceptKey(partial, "program");
		},
		ContentStatement: function ContentStatement() {},
		CommentStatement: function CommentStatement() {},
		SubExpression: visitSubExpression,
		PathExpression: function PathExpression() {},
		StringLiteral: function StringLiteral() {},
		NumberLiteral: function NumberLiteral() {},
		BooleanLiteral: function BooleanLiteral() {},
		UndefinedLiteral: function UndefinedLiteral() {},
		NullLiteral: function NullLiteral() {},
		Hash: function Hash$1(hash) {
			this.acceptArray(hash.pairs);
		},
		HashPair: function HashPair(pair) {
			this.acceptRequired(pair, "value");
		}
	};
	function visitSubExpression(mustache) {
		this.acceptRequired(mustache, "path");
		this.acceptArray(mustache.params);
		this.acceptKey(mustache, "hash");
	}
	function visitBlock(block) {
		visitSubExpression.call(this, block);
		this.acceptKey(block, "program");
		this.acceptKey(block, "inverse");
	}
	function visitPartial(partial) {
		this.acceptRequired(partial, "name");
		this.acceptArray(partial.params);
		this.acceptKey(partial, "hash");
	}
	exports["default"] = Visitor;
	module.exports = exports["default"];
}));
var require_whitespace_control = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	exports.__esModule = true;
	// istanbul ignore next
	function _interopRequireDefault$6(obj) {
		return obj && obj.__esModule ? obj : { "default": obj };
	}
	var _visitor2$1 = _interopRequireDefault$6(require_visitor());
	function WhitespaceControl() {
		this.options = arguments.length <= 0 || arguments[0] === void 0 ? {} : arguments[0];
	}
	WhitespaceControl.prototype = new _visitor2$1["default"]();
	WhitespaceControl.prototype.Program = function(program) {
		var doStandalone = !this.options.ignoreStandalone;
		var isRoot = !this.isRootSeen;
		this.isRootSeen = true;
		var body = program.body;
		for (var i = 0, l = body.length; i < l; i++) {
			var current = body[i], strip$1 = this.accept(current);
			if (!strip$1) continue;
			var _isPrevWhitespace = isPrevWhitespace(body, i, isRoot), _isNextWhitespace = isNextWhitespace(body, i, isRoot), openStandalone = strip$1.openStandalone && _isPrevWhitespace, closeStandalone = strip$1.closeStandalone && _isNextWhitespace, inlineStandalone = strip$1.inlineStandalone && _isPrevWhitespace && _isNextWhitespace;
			if (strip$1.close) omitRight(body, i, true);
			if (strip$1.open) omitLeft(body, i, true);
			if (doStandalone && inlineStandalone) {
				omitRight(body, i);
				if (omitLeft(body, i)) {
					if (current.type === "PartialStatement") current.indent = /([ \t]+$)/.exec(body[i - 1].original)[1];
				}
			}
			if (doStandalone && openStandalone) {
				omitRight((current.program || current.inverse).body);
				omitLeft(body, i);
			}
			if (doStandalone && closeStandalone) {
				omitRight(body, i);
				omitLeft((current.inverse || current.program).body);
			}
		}
		return program;
	};
	WhitespaceControl.prototype.BlockStatement = WhitespaceControl.prototype.DecoratorBlock = WhitespaceControl.prototype.PartialBlockStatement = function(block) {
		this.accept(block.program);
		this.accept(block.inverse);
		var program = block.program || block.inverse, inverse = block.program && block.inverse, firstInverse = inverse, lastInverse = inverse;
		if (inverse && inverse.chained) {
			firstInverse = inverse.body[0].program;
			while (lastInverse.chained) lastInverse = lastInverse.body[lastInverse.body.length - 1].program;
		}
		var strip$1 = {
			open: block.openStrip.open,
			close: block.closeStrip.close,
			openStandalone: isNextWhitespace(program.body),
			closeStandalone: isPrevWhitespace((firstInverse || program).body)
		};
		if (block.openStrip.close) omitRight(program.body, null, true);
		if (inverse) {
			var inverseStrip = block.inverseStrip;
			if (inverseStrip.open) omitLeft(program.body, null, true);
			if (inverseStrip.close) omitRight(firstInverse.body, null, true);
			if (block.closeStrip.open) omitLeft(lastInverse.body, null, true);
			if (!this.options.ignoreStandalone && isPrevWhitespace(program.body) && isNextWhitespace(firstInverse.body)) {
				omitLeft(program.body);
				omitRight(firstInverse.body);
			}
		} else if (block.closeStrip.open) omitLeft(program.body, null, true);
		return strip$1;
	};
	WhitespaceControl.prototype.Decorator = WhitespaceControl.prototype.MustacheStatement = function(mustache) {
		return mustache.strip;
	};
	WhitespaceControl.prototype.PartialStatement = WhitespaceControl.prototype.CommentStatement = function(node) {
		/* istanbul ignore next */
		var strip$1 = node.strip || {};
		return {
			inlineStandalone: true,
			open: strip$1.open,
			close: strip$1.close
		};
	};
	function isPrevWhitespace(body, i, isRoot) {
		if (i === void 0) i = body.length;
		var prev = body[i - 1], sibling = body[i - 2];
		if (!prev) return isRoot;
		if (prev.type === "ContentStatement") return (sibling || !isRoot ? /\r?\n\s*?$/ : /(^|\r?\n)\s*?$/).test(prev.original);
	}
	function isNextWhitespace(body, i, isRoot) {
		if (i === void 0) i = -1;
		var next = body[i + 1], sibling = body[i + 2];
		if (!next) return isRoot;
		if (next.type === "ContentStatement") return (sibling || !isRoot ? /^\s*?\r?\n/ : /^\s*?(\r?\n|$)/).test(next.original);
	}
	function omitRight(body, i, multiple) {
		var current = body[i == null ? 0 : i + 1];
		if (!current || current.type !== "ContentStatement" || !multiple && current.rightStripped) return;
		var original = current.value;
		current.value = current.value.replace(multiple ? /^\s+/ : /^[ \t]*\r?\n?/, "");
		current.rightStripped = current.value !== original;
	}
	function omitLeft(body, i, multiple) {
		var current = body[i == null ? body.length - 1 : i - 1];
		if (!current || current.type !== "ContentStatement" || !multiple && current.leftStripped) return;
		var original = current.value;
		current.value = current.value.replace(multiple ? /\s+$/ : /[ \t]+$/, "");
		current.leftStripped = current.value !== original;
		return current.leftStripped;
	}
	exports["default"] = WhitespaceControl;
	module.exports = exports["default"];
}));
var require_helpers = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.__esModule = true;
	exports.SourceLocation = SourceLocation;
	exports.id = id;
	exports.stripFlags = stripFlags;
	exports.stripComment = stripComment;
	exports.preparePath = preparePath;
	exports.prepareMustache = prepareMustache;
	exports.prepareRawBlock = prepareRawBlock;
	exports.prepareBlock = prepareBlock;
	exports.prepareProgram = prepareProgram;
	exports.preparePartialBlock = preparePartialBlock;
	// istanbul ignore next
	function _interopRequireDefault$5(obj) {
		return obj && obj.__esModule ? obj : { "default": obj };
	}
	var _exception2$2 = _interopRequireDefault$5(require_exception());
	function validateClose(open, close) {
		close = close.path ? close.path.original : close;
		if (open.path.original !== close) {
			var errorNode = { loc: open.path.loc };
			throw new _exception2$2["default"](open.path.original + " doesn't match " + close, errorNode);
		}
	}
	function SourceLocation(source, locInfo) {
		this.source = source;
		this.start = {
			line: locInfo.first_line,
			column: locInfo.first_column
		};
		this.end = {
			line: locInfo.last_line,
			column: locInfo.last_column
		};
	}
	function id(token) {
		if (/^\[.*\]$/.test(token)) return token.substring(1, token.length - 1);
		else return token;
	}
	function stripFlags(open, close) {
		return {
			open: open.charAt(2) === "~",
			close: close.charAt(close.length - 3) === "~"
		};
	}
	function stripComment(comment) {
		return comment.replace(/^\{\{~?!-?-?/, "").replace(/-?-?~?\}\}$/, "");
	}
	function preparePath(data, parts, loc) {
		loc = this.locInfo(loc);
		var original = data ? "@" : "", dig = [], depth = 0;
		for (var i = 0, l = parts.length; i < l; i++) {
			var part = parts[i].part, isLiteral = parts[i].original !== part;
			original += (parts[i].separator || "") + part;
			if (!isLiteral && (part === ".." || part === "." || part === "this")) {
				if (dig.length > 0) throw new _exception2$2["default"]("Invalid path: " + original, { loc });
				else if (part === "..") depth++;
			} else dig.push(part);
		}
		return {
			type: "PathExpression",
			data,
			depth,
			parts: dig,
			original,
			loc
		};
	}
	function prepareMustache(path$1, params, hash, open, strip$1, locInfo) {
		var escapeFlag = open.charAt(3) || open.charAt(2), escaped = escapeFlag !== "{" && escapeFlag !== "&";
		return {
			type: /\*/.test(open) ? "Decorator" : "MustacheStatement",
			path: path$1,
			params,
			hash,
			escaped,
			strip: strip$1,
			loc: this.locInfo(locInfo)
		};
	}
	function prepareRawBlock(openRawBlock, contents, close, locInfo) {
		validateClose(openRawBlock, close);
		locInfo = this.locInfo(locInfo);
		var program = {
			type: "Program",
			body: contents,
			strip: {},
			loc: locInfo
		};
		return {
			type: "BlockStatement",
			path: openRawBlock.path,
			params: openRawBlock.params,
			hash: openRawBlock.hash,
			program,
			openStrip: {},
			inverseStrip: {},
			closeStrip: {},
			loc: locInfo
		};
	}
	function prepareBlock(openBlock, program, inverseAndProgram, close, inverted, locInfo) {
		if (close && close.path) validateClose(openBlock, close);
		var decorator = /\*/.test(openBlock.open);
		program.blockParams = openBlock.blockParams;
		var inverse = void 0, inverseStrip = void 0;
		if (inverseAndProgram) {
			if (decorator) throw new _exception2$2["default"]("Unexpected inverse block on decorator", inverseAndProgram);
			if (inverseAndProgram.chain) inverseAndProgram.program.body[0].closeStrip = close.strip;
			inverseStrip = inverseAndProgram.strip;
			inverse = inverseAndProgram.program;
		}
		if (inverted) {
			inverted = inverse;
			inverse = program;
			program = inverted;
		}
		return {
			type: decorator ? "DecoratorBlock" : "BlockStatement",
			path: openBlock.path,
			params: openBlock.params,
			hash: openBlock.hash,
			program,
			inverse,
			openStrip: openBlock.strip,
			inverseStrip,
			closeStrip: close && close.strip,
			loc: this.locInfo(locInfo)
		};
	}
	function prepareProgram(statements, loc) {
		if (!loc && statements.length) {
			var firstLoc = statements[0].loc, lastLoc = statements[statements.length - 1].loc;
			/* istanbul ignore else */
			if (firstLoc && lastLoc) loc = {
				source: firstLoc.source,
				start: {
					line: firstLoc.start.line,
					column: firstLoc.start.column
				},
				end: {
					line: lastLoc.end.line,
					column: lastLoc.end.column
				}
			};
		}
		return {
			type: "Program",
			body: statements,
			strip: {},
			loc
		};
	}
	function preparePartialBlock(open, program, close, locInfo) {
		validateClose(open, close);
		return {
			type: "PartialBlockStatement",
			name: open.path,
			params: open.params,
			hash: open.hash,
			program,
			openStrip: open.strip,
			closeStrip: close && close.strip,
			loc: this.locInfo(locInfo)
		};
	}
}));
var require_base = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.__esModule = true;
	exports.parseWithoutProcessing = parseWithoutProcessing;
	exports.parse = parse;
	// istanbul ignore next
	function _interopRequireWildcard(obj) {
		if (obj && obj.__esModule) return obj;
		else {
			var newObj = {};
			if (obj != null) {
				for (var key in obj) if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
			}
			newObj["default"] = obj;
			return newObj;
		}
	}
	// istanbul ignore next
	function _interopRequireDefault$4(obj) {
		return obj && obj.__esModule ? obj : { "default": obj };
	}
	var _parser2 = _interopRequireDefault$4(require_parser());
	var _whitespaceControl2 = _interopRequireDefault$4(require_whitespace_control());
	var Helpers = _interopRequireWildcard(require_helpers());
	var _utils$3 = require_utils();
	exports.parser = _parser2["default"];
	var yy = {};
	_utils$3.extend(yy, Helpers);
	function parseWithoutProcessing(input, options) {
		if (input.type === "Program") return input;
		_parser2["default"].yy = yy;
		yy.locInfo = function(locInfo) {
			return new yy.SourceLocation(options && options.srcName, locInfo);
		};
		return _parser2["default"].parse(input);
	}
	function parse(input, options) {
		var ast = parseWithoutProcessing(input, options);
		return new _whitespaceControl2["default"](options).accept(ast);
	}
}));
var require_compiler = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.__esModule = true;
	exports.Compiler = Compiler;
	exports.precompile = precompile;
	exports.compile = compile;
	// istanbul ignore next
	function _interopRequireDefault$3(obj) {
		return obj && obj.__esModule ? obj : { "default": obj };
	}
	var _exception2$1 = _interopRequireDefault$3(require_exception());
	var _utils$2 = require_utils();
	var _ast2 = _interopRequireDefault$3(require_ast());
	var slice$1 = [].slice;
	function Compiler() {}
	Compiler.prototype = {
		compiler: Compiler,
		equals: function equals$1(other) {
			var len = this.opcodes.length;
			if (other.opcodes.length !== len) return false;
			for (var i = 0; i < len; i++) {
				var opcode = this.opcodes[i], otherOpcode = other.opcodes[i];
				if (opcode.opcode !== otherOpcode.opcode || !argEquals(opcode.args, otherOpcode.args)) return false;
			}
			len = this.children.length;
			for (var i = 0; i < len; i++) if (!this.children[i].equals(other.children[i])) return false;
			return true;
		},
		guid: 0,
		compile: function compile$1(program, options) {
			this.sourceNode = [];
			this.opcodes = [];
			this.children = [];
			this.options = options;
			this.stringParams = options.stringParams;
			this.trackIds = options.trackIds;
			options.blockParams = options.blockParams || [];
			options.knownHelpers = _utils$2.extend(Object.create(null), {
				helperMissing: true,
				blockHelperMissing: true,
				each: true,
				"if": true,
				unless: true,
				"with": true,
				log: true,
				lookup: true
			}, options.knownHelpers);
			return this.accept(program);
		},
		compileProgram: function compileProgram(program) {
			var result = new this.compiler().compile(program, this.options), guid = this.guid++;
			this.usePartial = this.usePartial || result.usePartial;
			this.children[guid] = result;
			this.useDepths = this.useDepths || result.useDepths;
			return guid;
		},
		accept: function accept(node) {
			/* istanbul ignore next: Sanity code */
			if (!this[node.type]) throw new _exception2$1["default"]("Unknown type: " + node.type, node);
			this.sourceNode.unshift(node);
			var ret = this[node.type](node);
			this.sourceNode.shift();
			return ret;
		},
		Program: function Program(program) {
			this.options.blockParams.unshift(program.blockParams);
			var body = program.body, bodyLength = body.length;
			for (var i = 0; i < bodyLength; i++) this.accept(body[i]);
			this.options.blockParams.shift();
			this.isSimple = bodyLength === 1;
			this.blockParams = program.blockParams ? program.blockParams.length : 0;
			return this;
		},
		BlockStatement: function BlockStatement(block) {
			transformLiteralToPath(block);
			var program = block.program, inverse = block.inverse;
			program = program && this.compileProgram(program);
			inverse = inverse && this.compileProgram(inverse);
			var type = this.classifySexpr(block);
			if (type === "helper") this.helperSexpr(block, program, inverse);
			else if (type === "simple") {
				this.simpleSexpr(block);
				this.opcode("pushProgram", program);
				this.opcode("pushProgram", inverse);
				this.opcode("emptyHash");
				this.opcode("blockValue", block.path.original);
			} else {
				this.ambiguousSexpr(block, program, inverse);
				this.opcode("pushProgram", program);
				this.opcode("pushProgram", inverse);
				this.opcode("emptyHash");
				this.opcode("ambiguousBlockValue");
			}
			this.opcode("append");
		},
		DecoratorBlock: function DecoratorBlock(decorator) {
			var program = decorator.program && this.compileProgram(decorator.program);
			var params = this.setupFullMustacheParams(decorator, program, void 0), path$1 = decorator.path;
			this.useDecorators = true;
			this.opcode("registerDecorator", params.length, path$1.original);
		},
		PartialStatement: function PartialStatement(partial) {
			this.usePartial = true;
			var program = partial.program;
			if (program) program = this.compileProgram(partial.program);
			var params = partial.params;
			if (params.length > 1) throw new _exception2$1["default"]("Unsupported number of partial arguments: " + params.length, partial);
			else if (!params.length) if (this.options.explicitPartialContext) this.opcode("pushLiteral", "undefined");
			else params.push({
				type: "PathExpression",
				parts: [],
				depth: 0
			});
			var partialName = partial.name.original, isDynamic = partial.name.type === "SubExpression";
			if (isDynamic) this.accept(partial.name);
			this.setupFullMustacheParams(partial, program, void 0, true);
			var indent = partial.indent || "";
			if (this.options.preventIndent && indent) {
				this.opcode("appendContent", indent);
				indent = "";
			}
			this.opcode("invokePartial", isDynamic, partialName, indent);
			this.opcode("append");
		},
		PartialBlockStatement: function PartialBlockStatement(partialBlock) {
			this.PartialStatement(partialBlock);
		},
		MustacheStatement: function MustacheStatement(mustache) {
			this.SubExpression(mustache);
			if (mustache.escaped && !this.options.noEscape) this.opcode("appendEscaped");
			else this.opcode("append");
		},
		Decorator: function Decorator(decorator) {
			this.DecoratorBlock(decorator);
		},
		ContentStatement: function ContentStatement(content) {
			if (content.value) this.opcode("appendContent", content.value);
		},
		CommentStatement: function CommentStatement() {},
		SubExpression: function SubExpression(sexpr) {
			transformLiteralToPath(sexpr);
			var type = this.classifySexpr(sexpr);
			if (type === "simple") this.simpleSexpr(sexpr);
			else if (type === "helper") this.helperSexpr(sexpr);
			else this.ambiguousSexpr(sexpr);
		},
		ambiguousSexpr: function ambiguousSexpr(sexpr, program, inverse) {
			var path$1 = sexpr.path, name = path$1.parts[0], isBlock$1 = program != null || inverse != null;
			this.opcode("getContext", path$1.depth);
			this.opcode("pushProgram", program);
			this.opcode("pushProgram", inverse);
			path$1.strict = true;
			this.accept(path$1);
			this.opcode("invokeAmbiguous", name, isBlock$1);
		},
		simpleSexpr: function simpleSexpr(sexpr) {
			var path$1 = sexpr.path;
			path$1.strict = true;
			this.accept(path$1);
			this.opcode("resolvePossibleLambda");
		},
		helperSexpr: function helperSexpr(sexpr, program, inverse) {
			var params = this.setupFullMustacheParams(sexpr, program, inverse), path$1 = sexpr.path, name = path$1.parts[0];
			if (this.options.knownHelpers[name]) this.opcode("invokeKnownHelper", params.length, name);
			else if (this.options.knownHelpersOnly) throw new _exception2$1["default"]("You specified knownHelpersOnly, but used the unknown helper " + name, sexpr);
			else {
				path$1.strict = true;
				path$1.falsy = true;
				this.accept(path$1);
				this.opcode("invokeHelper", params.length, path$1.original, _ast2["default"].helpers.simpleId(path$1));
			}
		},
		PathExpression: function PathExpression(path$1) {
			this.addDepth(path$1.depth);
			this.opcode("getContext", path$1.depth);
			var name = path$1.parts[0], scoped = _ast2["default"].helpers.scopedId(path$1), blockParamId = !path$1.depth && !scoped && this.blockParamIndex(name);
			if (blockParamId) this.opcode("lookupBlockParam", blockParamId, path$1.parts);
			else if (!name) this.opcode("pushContext");
			else if (path$1.data) {
				this.options.data = true;
				this.opcode("lookupData", path$1.depth, path$1.parts, path$1.strict);
			} else this.opcode("lookupOnContext", path$1.parts, path$1.falsy, path$1.strict, scoped);
		},
		StringLiteral: function StringLiteral(string$1) {
			this.opcode("pushString", string$1.value);
		},
		NumberLiteral: function NumberLiteral(number) {
			this.opcode("pushLiteral", number.value);
		},
		BooleanLiteral: function BooleanLiteral(bool) {
			this.opcode("pushLiteral", bool.value);
		},
		UndefinedLiteral: function UndefinedLiteral() {
			this.opcode("pushLiteral", "undefined");
		},
		NullLiteral: function NullLiteral() {
			this.opcode("pushLiteral", "null");
		},
		Hash: function Hash$1(hash) {
			var pairs$1 = hash.pairs, i = 0, l = pairs$1.length;
			this.opcode("pushHash");
			for (; i < l; i++) this.pushParam(pairs$1[i].value);
			while (i--) this.opcode("assignToHash", pairs$1[i].key);
			this.opcode("popHash");
		},
		opcode: function opcode(name) {
			this.opcodes.push({
				opcode: name,
				args: slice$1.call(arguments, 1),
				loc: this.sourceNode[0].loc
			});
		},
		addDepth: function addDepth(depth) {
			if (!depth) return;
			this.useDepths = true;
		},
		classifySexpr: function classifySexpr(sexpr) {
			var isSimple = _ast2["default"].helpers.simpleId(sexpr.path);
			var isBlockParam = isSimple && !!this.blockParamIndex(sexpr.path.parts[0]);
			var isHelper = !isBlockParam && _ast2["default"].helpers.helperExpression(sexpr);
			var isEligible = !isBlockParam && (isHelper || isSimple);
			if (isEligible && !isHelper) {
				var _name = sexpr.path.parts[0], options = this.options;
				if (options.knownHelpers[_name]) isHelper = true;
				else if (options.knownHelpersOnly) isEligible = false;
			}
			if (isHelper) return "helper";
			else if (isEligible) return "ambiguous";
			else return "simple";
		},
		pushParams: function pushParams(params) {
			for (var i = 0, l = params.length; i < l; i++) this.pushParam(params[i]);
		},
		pushParam: function pushParam(val) {
			var value = val.value != null ? val.value : val.original || "";
			if (this.stringParams) {
				if (value.replace) value = value.replace(/^(\.?\.\/)*/g, "").replace(/\//g, ".");
				if (val.depth) this.addDepth(val.depth);
				this.opcode("getContext", val.depth || 0);
				this.opcode("pushStringParam", value, val.type);
				if (val.type === "SubExpression") this.accept(val);
			} else {
				if (this.trackIds) {
					var blockParamIndex = void 0;
					if (val.parts && !_ast2["default"].helpers.scopedId(val) && !val.depth) blockParamIndex = this.blockParamIndex(val.parts[0]);
					if (blockParamIndex) {
						var blockParamChild = val.parts.slice(1).join(".");
						this.opcode("pushId", "BlockParam", blockParamIndex, blockParamChild);
					} else {
						value = val.original || value;
						if (value.replace) value = value.replace(/^this(?:\.|$)/, "").replace(/^\.\//, "").replace(/^\.$/, "");
						this.opcode("pushId", val.type, value);
					}
				}
				this.accept(val);
			}
		},
		setupFullMustacheParams: function setupFullMustacheParams(sexpr, program, inverse, omitEmpty) {
			var params = sexpr.params;
			this.pushParams(params);
			this.opcode("pushProgram", program);
			this.opcode("pushProgram", inverse);
			if (sexpr.hash) this.accept(sexpr.hash);
			else this.opcode("emptyHash", omitEmpty);
			return params;
		},
		blockParamIndex: function blockParamIndex(name) {
			for (var depth = 0, len = this.options.blockParams.length; depth < len; depth++) {
				var blockParams$1 = this.options.blockParams[depth], param = blockParams$1 && _utils$2.indexOf(blockParams$1, name);
				if (blockParams$1 && param >= 0) return [depth, param];
			}
		}
	};
	function precompile(input, options, env) {
		if (input == null || typeof input !== "string" && input.type !== "Program") throw new _exception2$1["default"]("You must pass a string or Handlebars AST to Handlebars.precompile. You passed " + input);
		options = options || {};
		if (!("data" in options)) options.data = true;
		if (options.compat) options.useDepths = true;
		var ast = env.parse(input, options), environment = new env.Compiler().compile(ast, options);
		return new env.JavaScriptCompiler().compile(environment, options);
	}
	function compile(input, options, env) {
		if (options === void 0) options = {};
		if (input == null || typeof input !== "string" && input.type !== "Program") throw new _exception2$1["default"]("You must pass a string or Handlebars AST to Handlebars.compile. You passed " + input);
		options = _utils$2.extend({}, options);
		if (!("data" in options)) options.data = true;
		if (options.compat) options.useDepths = true;
		var compiled = void 0;
		function compileInput() {
			var ast = env.parse(input, options), environment = new env.Compiler().compile(ast, options), templateSpec = new env.JavaScriptCompiler().compile(environment, options, void 0, true);
			return env.template(templateSpec);
		}
		function ret(context, execOptions) {
			if (!compiled) compiled = compileInput();
			return compiled.call(this, context, execOptions);
		}
		ret._setup = function(setupOptions) {
			if (!compiled) compiled = compileInput();
			return compiled._setup(setupOptions);
		};
		ret._child = function(i, data, blockParams$1, depths) {
			if (!compiled) compiled = compileInput();
			return compiled._child(i, data, blockParams$1, depths);
		};
		return ret;
	}
	function argEquals(a, b) {
		if (a === b) return true;
		if (_utils$2.isArray(a) && _utils$2.isArray(b) && a.length === b.length) {
			for (var i = 0; i < a.length; i++) if (!argEquals(a[i], b[i])) return false;
			return true;
		}
	}
	function transformLiteralToPath(sexpr) {
		if (!sexpr.path.parts) {
			var literal = sexpr.path;
			sexpr.path = {
				type: "PathExpression",
				data: false,
				depth: 0,
				parts: [literal.original + ""],
				original: literal.original + "",
				loc: literal.loc
			};
		}
	}
}));
var require_base64 = /* @__PURE__ */ __commonJSMin(((exports) => {
	var intToCharMap = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("");
	exports.encode = function(number) {
		if (0 <= number && number < intToCharMap.length) return intToCharMap[number];
		throw new TypeError("Must be between 0 and 63: " + number);
	};
	exports.decode = function(charCode) {
		var bigA = 65;
		var bigZ = 90;
		var littleA = 97;
		var littleZ = 122;
		var zero = 48;
		var nine = 57;
		var plus$1 = 43;
		var slash = 47;
		var littleOffset = 26;
		var numberOffset = 52;
		if (bigA <= charCode && charCode <= bigZ) return charCode - bigA;
		if (littleA <= charCode && charCode <= littleZ) return charCode - littleA + littleOffset;
		if (zero <= charCode && charCode <= nine) return charCode - zero + numberOffset;
		if (charCode == plus$1) return 62;
		if (charCode == slash) return 63;
		return -1;
	};
}));
var require_base64_vlq = /* @__PURE__ */ __commonJSMin(((exports) => {
	var base64 = require_base64();
	var VLQ_BASE_SHIFT = 5;
	var VLQ_BASE = 1 << VLQ_BASE_SHIFT;
	var VLQ_BASE_MASK = VLQ_BASE - 1;
	var VLQ_CONTINUATION_BIT = VLQ_BASE;
	function toVLQSigned(aValue) {
		return aValue < 0 ? (-aValue << 1) + 1 : (aValue << 1) + 0;
	}
	function fromVLQSigned(aValue) {
		var isNegative = (aValue & 1) === 1;
		var shifted = aValue >> 1;
		return isNegative ? -shifted : shifted;
	}
	exports.encode = function base64VLQ_encode(aValue) {
		var encoded = "";
		var digit;
		var vlq = toVLQSigned(aValue);
		do {
			digit = vlq & VLQ_BASE_MASK;
			vlq >>>= VLQ_BASE_SHIFT;
			if (vlq > 0) digit |= VLQ_CONTINUATION_BIT;
			encoded += base64.encode(digit);
		} while (vlq > 0);
		return encoded;
	};
	exports.decode = function base64VLQ_decode(aStr, aIndex, aOutParam) {
		var strLen = aStr.length;
		var result = 0;
		var shift$1 = 0;
		var continuation, digit;
		do {
			if (aIndex >= strLen) throw new Error("Expected more digits in base 64 VLQ value.");
			digit = base64.decode(aStr.charCodeAt(aIndex++));
			if (digit === -1) throw new Error("Invalid base64 digit: " + aStr.charAt(aIndex - 1));
			continuation = !!(digit & VLQ_CONTINUATION_BIT);
			digit &= VLQ_BASE_MASK;
			result = result + (digit << shift$1);
			shift$1 += VLQ_BASE_SHIFT;
		} while (continuation);
		aOutParam.value = fromVLQSigned(result);
		aOutParam.rest = aIndex;
	};
}));
var require_util = /* @__PURE__ */ __commonJSMin(((exports) => {
	function getArg(aArgs, aName, aDefaultValue) {
		if (aName in aArgs) return aArgs[aName];
		else if (arguments.length === 3) return aDefaultValue;
		else throw new Error("\"" + aName + "\" is a required argument.");
	}
	exports.getArg = getArg;
	var urlRegexp = /^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.-]*)(?::(\d+))?(.*)$/;
	var dataUrlRegexp = /^data:.+\,.+$/;
	function urlParse(aUrl) {
		var match = aUrl.match(urlRegexp);
		if (!match) return null;
		return {
			scheme: match[1],
			auth: match[2],
			host: match[3],
			port: match[4],
			path: match[5]
		};
	}
	exports.urlParse = urlParse;
	function urlGenerate(aParsedUrl) {
		var url = "";
		if (aParsedUrl.scheme) url += aParsedUrl.scheme + ":";
		url += "//";
		if (aParsedUrl.auth) url += aParsedUrl.auth + "@";
		if (aParsedUrl.host) url += aParsedUrl.host;
		if (aParsedUrl.port) url += ":" + aParsedUrl.port;
		if (aParsedUrl.path) url += aParsedUrl.path;
		return url;
	}
	exports.urlGenerate = urlGenerate;
	function normalize$1(aPath) {
		var path$1 = aPath;
		var url = urlParse(aPath);
		if (url) {
			if (!url.path) return aPath;
			path$1 = url.path;
		}
		var isAbsolute = exports.isAbsolute(path$1);
		var parts = path$1.split(/\/+/);
		for (var part, up = 0, i = parts.length - 1; i >= 0; i--) {
			part = parts[i];
			if (part === ".") parts.splice(i, 1);
			else if (part === "..") up++;
			else if (up > 0) if (part === "") {
				parts.splice(i + 1, up);
				up = 0;
			} else {
				parts.splice(i, 2);
				up--;
			}
		}
		path$1 = parts.join("/");
		if (path$1 === "") path$1 = isAbsolute ? "/" : ".";
		if (url) {
			url.path = path$1;
			return urlGenerate(url);
		}
		return path$1;
	}
	exports.normalize = normalize$1;
	function join$1(aRoot, aPath) {
		if (aRoot === "") aRoot = ".";
		if (aPath === "") aPath = ".";
		var aPathUrl = urlParse(aPath);
		var aRootUrl = urlParse(aRoot);
		if (aRootUrl) aRoot = aRootUrl.path || "/";
		if (aPathUrl && !aPathUrl.scheme) {
			if (aRootUrl) aPathUrl.scheme = aRootUrl.scheme;
			return urlGenerate(aPathUrl);
		}
		if (aPathUrl || aPath.match(dataUrlRegexp)) return aPath;
		if (aRootUrl && !aRootUrl.host && !aRootUrl.path) {
			aRootUrl.host = aPath;
			return urlGenerate(aRootUrl);
		}
		var joined = aPath.charAt(0) === "/" ? aPath : normalize$1(aRoot.replace(/\/+$/, "") + "/" + aPath);
		if (aRootUrl) {
			aRootUrl.path = joined;
			return urlGenerate(aRootUrl);
		}
		return joined;
	}
	exports.join = join$1;
	exports.isAbsolute = function(aPath) {
		return aPath.charAt(0) === "/" || urlRegexp.test(aPath);
	};
	function relative(aRoot, aPath) {
		if (aRoot === "") aRoot = ".";
		aRoot = aRoot.replace(/\/$/, "");
		var level = 0;
		while (aPath.indexOf(aRoot + "/") !== 0) {
			var index = aRoot.lastIndexOf("/");
			if (index < 0) return aPath;
			aRoot = aRoot.slice(0, index);
			if (aRoot.match(/^([^\/]+:\/)?\/*$/)) return aPath;
			++level;
		}
		return Array(level + 1).join("../") + aPath.substr(aRoot.length + 1);
	}
	exports.relative = relative;
	var supportsNullProto = function() {
		return !("__proto__" in Object.create(null));
	}();
	function identity(s) {
		return s;
	}
	function toSetString(aStr) {
		if (isProtoString(aStr)) return "$" + aStr;
		return aStr;
	}
	exports.toSetString = supportsNullProto ? identity : toSetString;
	function fromSetString(aStr) {
		if (isProtoString(aStr)) return aStr.slice(1);
		return aStr;
	}
	exports.fromSetString = supportsNullProto ? identity : fromSetString;
	function isProtoString(s) {
		if (!s) return false;
		var length = s.length;
		if (length < 9) return false;
		if (s.charCodeAt(length - 1) !== 95 || s.charCodeAt(length - 2) !== 95 || s.charCodeAt(length - 3) !== 111 || s.charCodeAt(length - 4) !== 116 || s.charCodeAt(length - 5) !== 111 || s.charCodeAt(length - 6) !== 114 || s.charCodeAt(length - 7) !== 112 || s.charCodeAt(length - 8) !== 95 || s.charCodeAt(length - 9) !== 95) return false;
		for (var i = length - 10; i >= 0; i--) if (s.charCodeAt(i) !== 36) return false;
		return true;
	}
	function compareByOriginalPositions(mappingA, mappingB, onlyCompareOriginal) {
		var cmp = strcmp(mappingA.source, mappingB.source);
		if (cmp !== 0) return cmp;
		cmp = mappingA.originalLine - mappingB.originalLine;
		if (cmp !== 0) return cmp;
		cmp = mappingA.originalColumn - mappingB.originalColumn;
		if (cmp !== 0 || onlyCompareOriginal) return cmp;
		cmp = mappingA.generatedColumn - mappingB.generatedColumn;
		if (cmp !== 0) return cmp;
		cmp = mappingA.generatedLine - mappingB.generatedLine;
		if (cmp !== 0) return cmp;
		return strcmp(mappingA.name, mappingB.name);
	}
	exports.compareByOriginalPositions = compareByOriginalPositions;
	function compareByGeneratedPositionsDeflated(mappingA, mappingB, onlyCompareGenerated) {
		var cmp = mappingA.generatedLine - mappingB.generatedLine;
		if (cmp !== 0) return cmp;
		cmp = mappingA.generatedColumn - mappingB.generatedColumn;
		if (cmp !== 0 || onlyCompareGenerated) return cmp;
		cmp = strcmp(mappingA.source, mappingB.source);
		if (cmp !== 0) return cmp;
		cmp = mappingA.originalLine - mappingB.originalLine;
		if (cmp !== 0) return cmp;
		cmp = mappingA.originalColumn - mappingB.originalColumn;
		if (cmp !== 0) return cmp;
		return strcmp(mappingA.name, mappingB.name);
	}
	exports.compareByGeneratedPositionsDeflated = compareByGeneratedPositionsDeflated;
	function strcmp(aStr1, aStr2) {
		if (aStr1 === aStr2) return 0;
		if (aStr1 === null) return 1;
		if (aStr2 === null) return -1;
		if (aStr1 > aStr2) return 1;
		return -1;
	}
	function compareByGeneratedPositionsInflated(mappingA, mappingB) {
		var cmp = mappingA.generatedLine - mappingB.generatedLine;
		if (cmp !== 0) return cmp;
		cmp = mappingA.generatedColumn - mappingB.generatedColumn;
		if (cmp !== 0) return cmp;
		cmp = strcmp(mappingA.source, mappingB.source);
		if (cmp !== 0) return cmp;
		cmp = mappingA.originalLine - mappingB.originalLine;
		if (cmp !== 0) return cmp;
		cmp = mappingA.originalColumn - mappingB.originalColumn;
		if (cmp !== 0) return cmp;
		return strcmp(mappingA.name, mappingB.name);
	}
	exports.compareByGeneratedPositionsInflated = compareByGeneratedPositionsInflated;
	function parseSourceMapInput(str) {
		return JSON.parse(str.replace(/^\)]}'[^\n]*\n/, ""));
	}
	exports.parseSourceMapInput = parseSourceMapInput;
	function computeSourceURL(sourceRoot, sourceURL, sourceMapURL) {
		sourceURL = sourceURL || "";
		if (sourceRoot) {
			if (sourceRoot[sourceRoot.length - 1] !== "/" && sourceURL[0] !== "/") sourceRoot += "/";
			sourceURL = sourceRoot + sourceURL;
		}
		if (sourceMapURL) {
			var parsed = urlParse(sourceMapURL);
			if (!parsed) throw new Error("sourceMapURL could not be parsed");
			if (parsed.path) {
				var index = parsed.path.lastIndexOf("/");
				if (index >= 0) parsed.path = parsed.path.substring(0, index + 1);
			}
			sourceURL = join$1(urlGenerate(parsed), sourceURL);
		}
		return normalize$1(sourceURL);
	}
	exports.computeSourceURL = computeSourceURL;
}));
var require_array_set = /* @__PURE__ */ __commonJSMin(((exports) => {
	var util$4 = require_util();
	var has$1 = Object.prototype.hasOwnProperty;
	var hasNativeMap = typeof Map !== "undefined";
	function ArraySet$2() {
		this._array = [];
		this._set = hasNativeMap ? /* @__PURE__ */ new Map() : Object.create(null);
	}
	ArraySet$2.fromArray = function ArraySet_fromArray(aArray, aAllowDuplicates) {
		var set$1 = new ArraySet$2();
		for (var i = 0, len = aArray.length; i < len; i++) set$1.add(aArray[i], aAllowDuplicates);
		return set$1;
	};
	ArraySet$2.prototype.size = function ArraySet_size() {
		return hasNativeMap ? this._set.size : Object.getOwnPropertyNames(this._set).length;
	};
	ArraySet$2.prototype.add = function ArraySet_add(aStr, aAllowDuplicates) {
		var sStr = hasNativeMap ? aStr : util$4.toSetString(aStr);
		var isDuplicate = hasNativeMap ? this.has(aStr) : has$1.call(this._set, sStr);
		var idx = this._array.length;
		if (!isDuplicate || aAllowDuplicates) this._array.push(aStr);
		if (!isDuplicate) if (hasNativeMap) this._set.set(aStr, idx);
		else this._set[sStr] = idx;
	};
	ArraySet$2.prototype.has = function ArraySet_has(aStr) {
		if (hasNativeMap) return this._set.has(aStr);
		else {
			var sStr = util$4.toSetString(aStr);
			return has$1.call(this._set, sStr);
		}
	};
	ArraySet$2.prototype.indexOf = function ArraySet_indexOf(aStr) {
		if (hasNativeMap) {
			var idx = this._set.get(aStr);
			if (idx >= 0) return idx;
		} else {
			var sStr = util$4.toSetString(aStr);
			if (has$1.call(this._set, sStr)) return this._set[sStr];
		}
		throw new Error("\"" + aStr + "\" is not in the set.");
	};
	ArraySet$2.prototype.at = function ArraySet_at(aIdx) {
		if (aIdx >= 0 && aIdx < this._array.length) return this._array[aIdx];
		throw new Error("No element indexed by " + aIdx);
	};
	ArraySet$2.prototype.toArray = function ArraySet_toArray() {
		return this._array.slice();
	};
	exports.ArraySet = ArraySet$2;
}));
var require_mapping_list = /* @__PURE__ */ __commonJSMin(((exports) => {
	var util$3 = require_util();
	function generatedPositionAfter(mappingA, mappingB) {
		var lineA = mappingA.generatedLine;
		var lineB = mappingB.generatedLine;
		var columnA = mappingA.generatedColumn;
		var columnB = mappingB.generatedColumn;
		return lineB > lineA || lineB == lineA && columnB >= columnA || util$3.compareByGeneratedPositionsInflated(mappingA, mappingB) <= 0;
	}
	function MappingList$1() {
		this._array = [];
		this._sorted = true;
		this._last = {
			generatedLine: -1,
			generatedColumn: 0
		};
	}
	MappingList$1.prototype.unsortedForEach = function MappingList_forEach(aCallback, aThisArg) {
		this._array.forEach(aCallback, aThisArg);
	};
	MappingList$1.prototype.add = function MappingList_add(aMapping) {
		if (generatedPositionAfter(this._last, aMapping)) {
			this._last = aMapping;
			this._array.push(aMapping);
		} else {
			this._sorted = false;
			this._array.push(aMapping);
		}
	};
	MappingList$1.prototype.toArray = function MappingList_toArray() {
		if (!this._sorted) {
			this._array.sort(util$3.compareByGeneratedPositionsInflated);
			this._sorted = true;
		}
		return this._array;
	};
	exports.MappingList = MappingList$1;
}));
var require_source_map_generator = /* @__PURE__ */ __commonJSMin(((exports) => {
	var base64VLQ$1 = require_base64_vlq();
	var util$2 = require_util();
	var ArraySet$1 = require_array_set().ArraySet;
	var MappingList = require_mapping_list().MappingList;
	function SourceMapGenerator$1(aArgs) {
		if (!aArgs) aArgs = {};
		this._file = util$2.getArg(aArgs, "file", null);
		this._sourceRoot = util$2.getArg(aArgs, "sourceRoot", null);
		this._skipValidation = util$2.getArg(aArgs, "skipValidation", false);
		this._sources = new ArraySet$1();
		this._names = new ArraySet$1();
		this._mappings = new MappingList();
		this._sourcesContents = null;
	}
	SourceMapGenerator$1.prototype._version = 3;
	SourceMapGenerator$1.fromSourceMap = function SourceMapGenerator_fromSourceMap(aSourceMapConsumer) {
		var sourceRoot = aSourceMapConsumer.sourceRoot;
		var generator = new SourceMapGenerator$1({
			file: aSourceMapConsumer.file,
			sourceRoot
		});
		aSourceMapConsumer.eachMapping(function(mapping) {
			var newMapping = { generated: {
				line: mapping.generatedLine,
				column: mapping.generatedColumn
			} };
			if (mapping.source != null) {
				newMapping.source = mapping.source;
				if (sourceRoot != null) newMapping.source = util$2.relative(sourceRoot, newMapping.source);
				newMapping.original = {
					line: mapping.originalLine,
					column: mapping.originalColumn
				};
				if (mapping.name != null) newMapping.name = mapping.name;
			}
			generator.addMapping(newMapping);
		});
		aSourceMapConsumer.sources.forEach(function(sourceFile) {
			var sourceRelative = sourceFile;
			if (sourceRoot !== null) sourceRelative = util$2.relative(sourceRoot, sourceFile);
			if (!generator._sources.has(sourceRelative)) generator._sources.add(sourceRelative);
			var content = aSourceMapConsumer.sourceContentFor(sourceFile);
			if (content != null) generator.setSourceContent(sourceFile, content);
		});
		return generator;
	};
	SourceMapGenerator$1.prototype.addMapping = function SourceMapGenerator_addMapping(aArgs) {
		var generated = util$2.getArg(aArgs, "generated");
		var original = util$2.getArg(aArgs, "original", null);
		var source = util$2.getArg(aArgs, "source", null);
		var name = util$2.getArg(aArgs, "name", null);
		if (!this._skipValidation) this._validateMapping(generated, original, source, name);
		if (source != null) {
			source = String(source);
			if (!this._sources.has(source)) this._sources.add(source);
		}
		if (name != null) {
			name = String(name);
			if (!this._names.has(name)) this._names.add(name);
		}
		this._mappings.add({
			generatedLine: generated.line,
			generatedColumn: generated.column,
			originalLine: original != null && original.line,
			originalColumn: original != null && original.column,
			source,
			name
		});
	};
	SourceMapGenerator$1.prototype.setSourceContent = function SourceMapGenerator_setSourceContent(aSourceFile, aSourceContent) {
		var source = aSourceFile;
		if (this._sourceRoot != null) source = util$2.relative(this._sourceRoot, source);
		if (aSourceContent != null) {
			if (!this._sourcesContents) this._sourcesContents = Object.create(null);
			this._sourcesContents[util$2.toSetString(source)] = aSourceContent;
		} else if (this._sourcesContents) {
			delete this._sourcesContents[util$2.toSetString(source)];
			if (Object.keys(this._sourcesContents).length === 0) this._sourcesContents = null;
		}
	};
	SourceMapGenerator$1.prototype.applySourceMap = function SourceMapGenerator_applySourceMap(aSourceMapConsumer, aSourceFile, aSourceMapPath) {
		var sourceFile = aSourceFile;
		if (aSourceFile == null) {
			if (aSourceMapConsumer.file == null) throw new Error("SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, or the source map's \"file\" property. Both were omitted.");
			sourceFile = aSourceMapConsumer.file;
		}
		var sourceRoot = this._sourceRoot;
		if (sourceRoot != null) sourceFile = util$2.relative(sourceRoot, sourceFile);
		var newSources = new ArraySet$1();
		var newNames = new ArraySet$1();
		this._mappings.unsortedForEach(function(mapping) {
			if (mapping.source === sourceFile && mapping.originalLine != null) {
				var original = aSourceMapConsumer.originalPositionFor({
					line: mapping.originalLine,
					column: mapping.originalColumn
				});
				if (original.source != null) {
					mapping.source = original.source;
					if (aSourceMapPath != null) mapping.source = util$2.join(aSourceMapPath, mapping.source);
					if (sourceRoot != null) mapping.source = util$2.relative(sourceRoot, mapping.source);
					mapping.originalLine = original.line;
					mapping.originalColumn = original.column;
					if (original.name != null) mapping.name = original.name;
				}
			}
			var source = mapping.source;
			if (source != null && !newSources.has(source)) newSources.add(source);
			var name = mapping.name;
			if (name != null && !newNames.has(name)) newNames.add(name);
		}, this);
		this._sources = newSources;
		this._names = newNames;
		aSourceMapConsumer.sources.forEach(function(sourceFile$1) {
			var content = aSourceMapConsumer.sourceContentFor(sourceFile$1);
			if (content != null) {
				if (aSourceMapPath != null) sourceFile$1 = util$2.join(aSourceMapPath, sourceFile$1);
				if (sourceRoot != null) sourceFile$1 = util$2.relative(sourceRoot, sourceFile$1);
				this.setSourceContent(sourceFile$1, content);
			}
		}, this);
	};
	SourceMapGenerator$1.prototype._validateMapping = function SourceMapGenerator_validateMapping(aGenerated, aOriginal, aSource, aName) {
		if (aOriginal && typeof aOriginal.line !== "number" && typeof aOriginal.column !== "number") throw new Error("original.line and original.column are not numbers -- you probably meant to omit the original mapping entirely and only map the generated position. If so, pass null for the original mapping instead of an object with empty or null values.");
		if (aGenerated && "line" in aGenerated && "column" in aGenerated && aGenerated.line > 0 && aGenerated.column >= 0 && !aOriginal && !aSource && !aName) return;
		else if (aGenerated && "line" in aGenerated && "column" in aGenerated && aOriginal && "line" in aOriginal && "column" in aOriginal && aGenerated.line > 0 && aGenerated.column >= 0 && aOriginal.line > 0 && aOriginal.column >= 0 && aSource) return;
		else throw new Error("Invalid mapping: " + JSON.stringify({
			generated: aGenerated,
			source: aSource,
			original: aOriginal,
			name: aName
		}));
	};
	SourceMapGenerator$1.prototype._serializeMappings = function SourceMapGenerator_serializeMappings() {
		var previousGeneratedColumn = 0;
		var previousGeneratedLine = 1;
		var previousOriginalColumn = 0;
		var previousOriginalLine = 0;
		var previousName = 0;
		var previousSource = 0;
		var result = "";
		var next;
		var mapping;
		var nameIdx;
		var sourceIdx;
		var mappings = this._mappings.toArray();
		for (var i = 0, len = mappings.length; i < len; i++) {
			mapping = mappings[i];
			next = "";
			if (mapping.generatedLine !== previousGeneratedLine) {
				previousGeneratedColumn = 0;
				while (mapping.generatedLine !== previousGeneratedLine) {
					next += ";";
					previousGeneratedLine++;
				}
			} else if (i > 0) {
				if (!util$2.compareByGeneratedPositionsInflated(mapping, mappings[i - 1])) continue;
				next += ",";
			}
			next += base64VLQ$1.encode(mapping.generatedColumn - previousGeneratedColumn);
			previousGeneratedColumn = mapping.generatedColumn;
			if (mapping.source != null) {
				sourceIdx = this._sources.indexOf(mapping.source);
				next += base64VLQ$1.encode(sourceIdx - previousSource);
				previousSource = sourceIdx;
				next += base64VLQ$1.encode(mapping.originalLine - 1 - previousOriginalLine);
				previousOriginalLine = mapping.originalLine - 1;
				next += base64VLQ$1.encode(mapping.originalColumn - previousOriginalColumn);
				previousOriginalColumn = mapping.originalColumn;
				if (mapping.name != null) {
					nameIdx = this._names.indexOf(mapping.name);
					next += base64VLQ$1.encode(nameIdx - previousName);
					previousName = nameIdx;
				}
			}
			result += next;
		}
		return result;
	};
	SourceMapGenerator$1.prototype._generateSourcesContent = function SourceMapGenerator_generateSourcesContent(aSources, aSourceRoot) {
		return aSources.map(function(source) {
			if (!this._sourcesContents) return null;
			if (aSourceRoot != null) source = util$2.relative(aSourceRoot, source);
			var key = util$2.toSetString(source);
			return Object.prototype.hasOwnProperty.call(this._sourcesContents, key) ? this._sourcesContents[key] : null;
		}, this);
	};
	SourceMapGenerator$1.prototype.toJSON = function SourceMapGenerator_toJSON() {
		var map$2 = {
			version: this._version,
			sources: this._sources.toArray(),
			names: this._names.toArray(),
			mappings: this._serializeMappings()
		};
		if (this._file != null) map$2.file = this._file;
		if (this._sourceRoot != null) map$2.sourceRoot = this._sourceRoot;
		if (this._sourcesContents) map$2.sourcesContent = this._generateSourcesContent(map$2.sources, map$2.sourceRoot);
		return map$2;
	};
	SourceMapGenerator$1.prototype.toString = function SourceMapGenerator_toString() {
		return JSON.stringify(this.toJSON());
	};
	exports.SourceMapGenerator = SourceMapGenerator$1;
}));
var require_binary_search = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.GREATEST_LOWER_BOUND = 1;
	exports.LEAST_UPPER_BOUND = 2;
	function recursiveSearch(aLow, aHigh, aNeedle, aHaystack, aCompare, aBias) {
		var mid = Math.floor((aHigh - aLow) / 2) + aLow;
		var cmp = aCompare(aNeedle, aHaystack[mid], true);
		if (cmp === 0) return mid;
		else if (cmp > 0) {
			if (aHigh - mid > 1) return recursiveSearch(mid, aHigh, aNeedle, aHaystack, aCompare, aBias);
			if (aBias == exports.LEAST_UPPER_BOUND) return aHigh < aHaystack.length ? aHigh : -1;
			else return mid;
		} else {
			if (mid - aLow > 1) return recursiveSearch(aLow, mid, aNeedle, aHaystack, aCompare, aBias);
			if (aBias == exports.LEAST_UPPER_BOUND) return mid;
			else return aLow < 0 ? -1 : aLow;
		}
	}
	exports.search = function search$1(aNeedle, aHaystack, aCompare, aBias) {
		if (aHaystack.length === 0) return -1;
		var index = recursiveSearch(-1, aHaystack.length, aNeedle, aHaystack, aCompare, aBias || exports.GREATEST_LOWER_BOUND);
		if (index < 0) return -1;
		while (index - 1 >= 0) {
			if (aCompare(aHaystack[index], aHaystack[index - 1], true) !== 0) break;
			--index;
		}
		return index;
	};
}));
var require_quick_sort = /* @__PURE__ */ __commonJSMin(((exports) => {
	function swap(ary, x, y) {
		var temp = ary[x];
		ary[x] = ary[y];
		ary[y] = temp;
	}
	function randomIntInRange(low, high) {
		return Math.round(low + Math.random() * (high - low));
	}
	function doQuickSort(ary, comparator, p, r) {
		if (p < r) {
			var pivotIndex = randomIntInRange(p, r);
			var i = p - 1;
			swap(ary, pivotIndex, r);
			var pivot = ary[r];
			for (var j = p; j < r; j++) if (comparator(ary[j], pivot) <= 0) {
				i += 1;
				swap(ary, i, j);
			}
			swap(ary, i + 1, j);
			var q = i + 1;
			doQuickSort(ary, comparator, p, q - 1);
			doQuickSort(ary, comparator, q + 1, r);
		}
	}
	exports.quickSort = function(ary, comparator) {
		doQuickSort(ary, comparator, 0, ary.length - 1);
	};
}));
var require_source_map_consumer = /* @__PURE__ */ __commonJSMin(((exports) => {
	var util$1 = require_util();
	var binarySearch = require_binary_search();
	var ArraySet = require_array_set().ArraySet;
	var base64VLQ = require_base64_vlq();
	var quickSort = require_quick_sort().quickSort;
	function SourceMapConsumer(aSourceMap, aSourceMapURL) {
		var sourceMap = aSourceMap;
		if (typeof aSourceMap === "string") sourceMap = util$1.parseSourceMapInput(aSourceMap);
		return sourceMap.sections != null ? new IndexedSourceMapConsumer(sourceMap, aSourceMapURL) : new BasicSourceMapConsumer(sourceMap, aSourceMapURL);
	}
	SourceMapConsumer.fromSourceMap = function(aSourceMap, aSourceMapURL) {
		return BasicSourceMapConsumer.fromSourceMap(aSourceMap, aSourceMapURL);
	};
	SourceMapConsumer.prototype._version = 3;
	SourceMapConsumer.prototype.__generatedMappings = null;
	Object.defineProperty(SourceMapConsumer.prototype, "_generatedMappings", {
		configurable: true,
		enumerable: true,
		get: function() {
			if (!this.__generatedMappings) this._parseMappings(this._mappings, this.sourceRoot);
			return this.__generatedMappings;
		}
	});
	SourceMapConsumer.prototype.__originalMappings = null;
	Object.defineProperty(SourceMapConsumer.prototype, "_originalMappings", {
		configurable: true,
		enumerable: true,
		get: function() {
			if (!this.__originalMappings) this._parseMappings(this._mappings, this.sourceRoot);
			return this.__originalMappings;
		}
	});
	SourceMapConsumer.prototype._charIsMappingSeparator = function SourceMapConsumer_charIsMappingSeparator(aStr, index) {
		var c = aStr.charAt(index);
		return c === ";" || c === ",";
	};
	SourceMapConsumer.prototype._parseMappings = function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
		throw new Error("Subclasses must implement _parseMappings");
	};
	SourceMapConsumer.GENERATED_ORDER = 1;
	SourceMapConsumer.ORIGINAL_ORDER = 2;
	SourceMapConsumer.GREATEST_LOWER_BOUND = 1;
	SourceMapConsumer.LEAST_UPPER_BOUND = 2;
	SourceMapConsumer.prototype.eachMapping = function SourceMapConsumer_eachMapping(aCallback, aContext, aOrder) {
		var context = aContext || null;
		var order = aOrder || SourceMapConsumer.GENERATED_ORDER;
		var mappings;
		switch (order) {
			case SourceMapConsumer.GENERATED_ORDER:
				mappings = this._generatedMappings;
				break;
			case SourceMapConsumer.ORIGINAL_ORDER:
				mappings = this._originalMappings;
				break;
			default: throw new Error("Unknown order of iteration.");
		}
		var sourceRoot = this.sourceRoot;
		mappings.map(function(mapping) {
			var source = mapping.source === null ? null : this._sources.at(mapping.source);
			source = util$1.computeSourceURL(sourceRoot, source, this._sourceMapURL);
			return {
				source,
				generatedLine: mapping.generatedLine,
				generatedColumn: mapping.generatedColumn,
				originalLine: mapping.originalLine,
				originalColumn: mapping.originalColumn,
				name: mapping.name === null ? null : this._names.at(mapping.name)
			};
		}, this).forEach(aCallback, context);
	};
	SourceMapConsumer.prototype.allGeneratedPositionsFor = function SourceMapConsumer_allGeneratedPositionsFor(aArgs) {
		var line = util$1.getArg(aArgs, "line");
		var needle = {
			source: util$1.getArg(aArgs, "source"),
			originalLine: line,
			originalColumn: util$1.getArg(aArgs, "column", 0)
		};
		needle.source = this._findSourceIndex(needle.source);
		if (needle.source < 0) return [];
		var mappings = [];
		var index = this._findMapping(needle, this._originalMappings, "originalLine", "originalColumn", util$1.compareByOriginalPositions, binarySearch.LEAST_UPPER_BOUND);
		if (index >= 0) {
			var mapping = this._originalMappings[index];
			if (aArgs.column === void 0) {
				var originalLine = mapping.originalLine;
				while (mapping && mapping.originalLine === originalLine) {
					mappings.push({
						line: util$1.getArg(mapping, "generatedLine", null),
						column: util$1.getArg(mapping, "generatedColumn", null),
						lastColumn: util$1.getArg(mapping, "lastGeneratedColumn", null)
					});
					mapping = this._originalMappings[++index];
				}
			} else {
				var originalColumn = mapping.originalColumn;
				while (mapping && mapping.originalLine === line && mapping.originalColumn == originalColumn) {
					mappings.push({
						line: util$1.getArg(mapping, "generatedLine", null),
						column: util$1.getArg(mapping, "generatedColumn", null),
						lastColumn: util$1.getArg(mapping, "lastGeneratedColumn", null)
					});
					mapping = this._originalMappings[++index];
				}
			}
		}
		return mappings;
	};
	exports.SourceMapConsumer = SourceMapConsumer;
	function BasicSourceMapConsumer(aSourceMap, aSourceMapURL) {
		var sourceMap = aSourceMap;
		if (typeof aSourceMap === "string") sourceMap = util$1.parseSourceMapInput(aSourceMap);
		var version = util$1.getArg(sourceMap, "version");
		var sources = util$1.getArg(sourceMap, "sources");
		var names = util$1.getArg(sourceMap, "names", []);
		var sourceRoot = util$1.getArg(sourceMap, "sourceRoot", null);
		var sourcesContent = util$1.getArg(sourceMap, "sourcesContent", null);
		var mappings = util$1.getArg(sourceMap, "mappings");
		var file = util$1.getArg(sourceMap, "file", null);
		if (version != this._version) throw new Error("Unsupported version: " + version);
		if (sourceRoot) sourceRoot = util$1.normalize(sourceRoot);
		sources = sources.map(String).map(util$1.normalize).map(function(source) {
			return sourceRoot && util$1.isAbsolute(sourceRoot) && util$1.isAbsolute(source) ? util$1.relative(sourceRoot, source) : source;
		});
		this._names = ArraySet.fromArray(names.map(String), true);
		this._sources = ArraySet.fromArray(sources, true);
		this._absoluteSources = this._sources.toArray().map(function(s) {
			return util$1.computeSourceURL(sourceRoot, s, aSourceMapURL);
		});
		this.sourceRoot = sourceRoot;
		this.sourcesContent = sourcesContent;
		this._mappings = mappings;
		this._sourceMapURL = aSourceMapURL;
		this.file = file;
	}
	BasicSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
	BasicSourceMapConsumer.prototype.consumer = SourceMapConsumer;
	BasicSourceMapConsumer.prototype._findSourceIndex = function(aSource) {
		var relativeSource = aSource;
		if (this.sourceRoot != null) relativeSource = util$1.relative(this.sourceRoot, relativeSource);
		if (this._sources.has(relativeSource)) return this._sources.indexOf(relativeSource);
		var i;
		for (i = 0; i < this._absoluteSources.length; ++i) if (this._absoluteSources[i] == aSource) return i;
		return -1;
	};
	BasicSourceMapConsumer.fromSourceMap = function SourceMapConsumer_fromSourceMap(aSourceMap, aSourceMapURL) {
		var smc = Object.create(BasicSourceMapConsumer.prototype);
		var names = smc._names = ArraySet.fromArray(aSourceMap._names.toArray(), true);
		var sources = smc._sources = ArraySet.fromArray(aSourceMap._sources.toArray(), true);
		smc.sourceRoot = aSourceMap._sourceRoot;
		smc.sourcesContent = aSourceMap._generateSourcesContent(smc._sources.toArray(), smc.sourceRoot);
		smc.file = aSourceMap._file;
		smc._sourceMapURL = aSourceMapURL;
		smc._absoluteSources = smc._sources.toArray().map(function(s) {
			return util$1.computeSourceURL(smc.sourceRoot, s, aSourceMapURL);
		});
		var generatedMappings = aSourceMap._mappings.toArray().slice();
		var destGeneratedMappings = smc.__generatedMappings = [];
		var destOriginalMappings = smc.__originalMappings = [];
		for (var i = 0, length = generatedMappings.length; i < length; i++) {
			var srcMapping = generatedMappings[i];
			var destMapping = new Mapping();
			destMapping.generatedLine = srcMapping.generatedLine;
			destMapping.generatedColumn = srcMapping.generatedColumn;
			if (srcMapping.source) {
				destMapping.source = sources.indexOf(srcMapping.source);
				destMapping.originalLine = srcMapping.originalLine;
				destMapping.originalColumn = srcMapping.originalColumn;
				if (srcMapping.name) destMapping.name = names.indexOf(srcMapping.name);
				destOriginalMappings.push(destMapping);
			}
			destGeneratedMappings.push(destMapping);
		}
		quickSort(smc.__originalMappings, util$1.compareByOriginalPositions);
		return smc;
	};
	BasicSourceMapConsumer.prototype._version = 3;
	Object.defineProperty(BasicSourceMapConsumer.prototype, "sources", { get: function() {
		return this._absoluteSources.slice();
	} });
	function Mapping() {
		this.generatedLine = 0;
		this.generatedColumn = 0;
		this.source = null;
		this.originalLine = null;
		this.originalColumn = null;
		this.name = null;
	}
	BasicSourceMapConsumer.prototype._parseMappings = function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
		var generatedLine = 1;
		var previousGeneratedColumn = 0;
		var previousOriginalLine = 0;
		var previousOriginalColumn = 0;
		var previousSource = 0;
		var previousName = 0;
		var length = aStr.length;
		var index = 0;
		var cachedSegments = {};
		var temp = {};
		var originalMappings = [];
		var generatedMappings = [];
		var mapping, str, segment, end, value;
		while (index < length) if (aStr.charAt(index) === ";") {
			generatedLine++;
			index++;
			previousGeneratedColumn = 0;
		} else if (aStr.charAt(index) === ",") index++;
		else {
			mapping = new Mapping();
			mapping.generatedLine = generatedLine;
			for (end = index; end < length; end++) if (this._charIsMappingSeparator(aStr, end)) break;
			str = aStr.slice(index, end);
			segment = cachedSegments[str];
			if (segment) index += str.length;
			else {
				segment = [];
				while (index < end) {
					base64VLQ.decode(aStr, index, temp);
					value = temp.value;
					index = temp.rest;
					segment.push(value);
				}
				if (segment.length === 2) throw new Error("Found a source, but no line and column");
				if (segment.length === 3) throw new Error("Found a source and line, but no column");
				cachedSegments[str] = segment;
			}
			mapping.generatedColumn = previousGeneratedColumn + segment[0];
			previousGeneratedColumn = mapping.generatedColumn;
			if (segment.length > 1) {
				mapping.source = previousSource + segment[1];
				previousSource += segment[1];
				mapping.originalLine = previousOriginalLine + segment[2];
				previousOriginalLine = mapping.originalLine;
				mapping.originalLine += 1;
				mapping.originalColumn = previousOriginalColumn + segment[3];
				previousOriginalColumn = mapping.originalColumn;
				if (segment.length > 4) {
					mapping.name = previousName + segment[4];
					previousName += segment[4];
				}
			}
			generatedMappings.push(mapping);
			if (typeof mapping.originalLine === "number") originalMappings.push(mapping);
		}
		quickSort(generatedMappings, util$1.compareByGeneratedPositionsDeflated);
		this.__generatedMappings = generatedMappings;
		quickSort(originalMappings, util$1.compareByOriginalPositions);
		this.__originalMappings = originalMappings;
	};
	BasicSourceMapConsumer.prototype._findMapping = function SourceMapConsumer_findMapping(aNeedle, aMappings, aLineName, aColumnName, aComparator, aBias) {
		if (aNeedle[aLineName] <= 0) throw new TypeError("Line must be greater than or equal to 1, got " + aNeedle[aLineName]);
		if (aNeedle[aColumnName] < 0) throw new TypeError("Column must be greater than or equal to 0, got " + aNeedle[aColumnName]);
		return binarySearch.search(aNeedle, aMappings, aComparator, aBias);
	};
	BasicSourceMapConsumer.prototype.computeColumnSpans = function SourceMapConsumer_computeColumnSpans() {
		for (var index = 0; index < this._generatedMappings.length; ++index) {
			var mapping = this._generatedMappings[index];
			if (index + 1 < this._generatedMappings.length) {
				var nextMapping = this._generatedMappings[index + 1];
				if (mapping.generatedLine === nextMapping.generatedLine) {
					mapping.lastGeneratedColumn = nextMapping.generatedColumn - 1;
					continue;
				}
			}
			mapping.lastGeneratedColumn = Infinity;
		}
	};
	BasicSourceMapConsumer.prototype.originalPositionFor = function SourceMapConsumer_originalPositionFor(aArgs) {
		var needle = {
			generatedLine: util$1.getArg(aArgs, "line"),
			generatedColumn: util$1.getArg(aArgs, "column")
		};
		var index = this._findMapping(needle, this._generatedMappings, "generatedLine", "generatedColumn", util$1.compareByGeneratedPositionsDeflated, util$1.getArg(aArgs, "bias", SourceMapConsumer.GREATEST_LOWER_BOUND));
		if (index >= 0) {
			var mapping = this._generatedMappings[index];
			if (mapping.generatedLine === needle.generatedLine) {
				var source = util$1.getArg(mapping, "source", null);
				if (source !== null) {
					source = this._sources.at(source);
					source = util$1.computeSourceURL(this.sourceRoot, source, this._sourceMapURL);
				}
				var name = util$1.getArg(mapping, "name", null);
				if (name !== null) name = this._names.at(name);
				return {
					source,
					line: util$1.getArg(mapping, "originalLine", null),
					column: util$1.getArg(mapping, "originalColumn", null),
					name
				};
			}
		}
		return {
			source: null,
			line: null,
			column: null,
			name: null
		};
	};
	BasicSourceMapConsumer.prototype.hasContentsOfAllSources = function BasicSourceMapConsumer_hasContentsOfAllSources() {
		if (!this.sourcesContent) return false;
		return this.sourcesContent.length >= this._sources.size() && !this.sourcesContent.some(function(sc) {
			return sc == null;
		});
	};
	BasicSourceMapConsumer.prototype.sourceContentFor = function SourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
		if (!this.sourcesContent) return null;
		var index = this._findSourceIndex(aSource);
		if (index >= 0) return this.sourcesContent[index];
		var relativeSource = aSource;
		if (this.sourceRoot != null) relativeSource = util$1.relative(this.sourceRoot, relativeSource);
		var url;
		if (this.sourceRoot != null && (url = util$1.urlParse(this.sourceRoot))) {
			var fileUriAbsPath = relativeSource.replace(/^file:\/\//, "");
			if (url.scheme == "file" && this._sources.has(fileUriAbsPath)) return this.sourcesContent[this._sources.indexOf(fileUriAbsPath)];
			if ((!url.path || url.path == "/") && this._sources.has("/" + relativeSource)) return this.sourcesContent[this._sources.indexOf("/" + relativeSource)];
		}
		if (nullOnMissing) return null;
		else throw new Error("\"" + relativeSource + "\" is not in the SourceMap.");
	};
	BasicSourceMapConsumer.prototype.generatedPositionFor = function SourceMapConsumer_generatedPositionFor(aArgs) {
		var source = util$1.getArg(aArgs, "source");
		source = this._findSourceIndex(source);
		if (source < 0) return {
			line: null,
			column: null,
			lastColumn: null
		};
		var needle = {
			source,
			originalLine: util$1.getArg(aArgs, "line"),
			originalColumn: util$1.getArg(aArgs, "column")
		};
		var index = this._findMapping(needle, this._originalMappings, "originalLine", "originalColumn", util$1.compareByOriginalPositions, util$1.getArg(aArgs, "bias", SourceMapConsumer.GREATEST_LOWER_BOUND));
		if (index >= 0) {
			var mapping = this._originalMappings[index];
			if (mapping.source === needle.source) return {
				line: util$1.getArg(mapping, "generatedLine", null),
				column: util$1.getArg(mapping, "generatedColumn", null),
				lastColumn: util$1.getArg(mapping, "lastGeneratedColumn", null)
			};
		}
		return {
			line: null,
			column: null,
			lastColumn: null
		};
	};
	exports.BasicSourceMapConsumer = BasicSourceMapConsumer;
	function IndexedSourceMapConsumer(aSourceMap, aSourceMapURL) {
		var sourceMap = aSourceMap;
		if (typeof aSourceMap === "string") sourceMap = util$1.parseSourceMapInput(aSourceMap);
		var version = util$1.getArg(sourceMap, "version");
		var sections = util$1.getArg(sourceMap, "sections");
		if (version != this._version) throw new Error("Unsupported version: " + version);
		this._sources = new ArraySet();
		this._names = new ArraySet();
		var lastOffset = {
			line: -1,
			column: 0
		};
		this._sections = sections.map(function(s) {
			if (s.url) throw new Error("Support for url field in sections not implemented.");
			var offset$1 = util$1.getArg(s, "offset");
			var offsetLine = util$1.getArg(offset$1, "line");
			var offsetColumn = util$1.getArg(offset$1, "column");
			if (offsetLine < lastOffset.line || offsetLine === lastOffset.line && offsetColumn < lastOffset.column) throw new Error("Section offsets must be ordered and non-overlapping.");
			lastOffset = offset$1;
			return {
				generatedOffset: {
					generatedLine: offsetLine + 1,
					generatedColumn: offsetColumn + 1
				},
				consumer: new SourceMapConsumer(util$1.getArg(s, "map"), aSourceMapURL)
			};
		});
	}
	IndexedSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
	IndexedSourceMapConsumer.prototype.constructor = SourceMapConsumer;
	IndexedSourceMapConsumer.prototype._version = 3;
	Object.defineProperty(IndexedSourceMapConsumer.prototype, "sources", { get: function() {
		var sources = [];
		for (var i = 0; i < this._sections.length; i++) for (var j = 0; j < this._sections[i].consumer.sources.length; j++) sources.push(this._sections[i].consumer.sources[j]);
		return sources;
	} });
	IndexedSourceMapConsumer.prototype.originalPositionFor = function IndexedSourceMapConsumer_originalPositionFor(aArgs) {
		var needle = {
			generatedLine: util$1.getArg(aArgs, "line"),
			generatedColumn: util$1.getArg(aArgs, "column")
		};
		var sectionIndex = binarySearch.search(needle, this._sections, function(needle$1, section$1) {
			var cmp = needle$1.generatedLine - section$1.generatedOffset.generatedLine;
			if (cmp) return cmp;
			return needle$1.generatedColumn - section$1.generatedOffset.generatedColumn;
		});
		var section = this._sections[sectionIndex];
		if (!section) return {
			source: null,
			line: null,
			column: null,
			name: null
		};
		return section.consumer.originalPositionFor({
			line: needle.generatedLine - (section.generatedOffset.generatedLine - 1),
			column: needle.generatedColumn - (section.generatedOffset.generatedLine === needle.generatedLine ? section.generatedOffset.generatedColumn - 1 : 0),
			bias: aArgs.bias
		});
	};
	IndexedSourceMapConsumer.prototype.hasContentsOfAllSources = function IndexedSourceMapConsumer_hasContentsOfAllSources() {
		return this._sections.every(function(s) {
			return s.consumer.hasContentsOfAllSources();
		});
	};
	IndexedSourceMapConsumer.prototype.sourceContentFor = function IndexedSourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
		for (var i = 0; i < this._sections.length; i++) {
			var content = this._sections[i].consumer.sourceContentFor(aSource, true);
			if (content) return content;
		}
		if (nullOnMissing) return null;
		else throw new Error("\"" + aSource + "\" is not in the SourceMap.");
	};
	IndexedSourceMapConsumer.prototype.generatedPositionFor = function IndexedSourceMapConsumer_generatedPositionFor(aArgs) {
		for (var i = 0; i < this._sections.length; i++) {
			var section = this._sections[i];
			if (section.consumer._findSourceIndex(util$1.getArg(aArgs, "source")) === -1) continue;
			var generatedPosition = section.consumer.generatedPositionFor(aArgs);
			if (generatedPosition) return {
				line: generatedPosition.line + (section.generatedOffset.generatedLine - 1),
				column: generatedPosition.column + (section.generatedOffset.generatedLine === generatedPosition.line ? section.generatedOffset.generatedColumn - 1 : 0)
			};
		}
		return {
			line: null,
			column: null
		};
	};
	IndexedSourceMapConsumer.prototype._parseMappings = function IndexedSourceMapConsumer_parseMappings(aStr, aSourceRoot) {
		this.__generatedMappings = [];
		this.__originalMappings = [];
		for (var i = 0; i < this._sections.length; i++) {
			var section = this._sections[i];
			var sectionMappings = section.consumer._generatedMappings;
			for (var j = 0; j < sectionMappings.length; j++) {
				var mapping = sectionMappings[j];
				var source = section.consumer._sources.at(mapping.source);
				source = util$1.computeSourceURL(section.consumer.sourceRoot, source, this._sourceMapURL);
				this._sources.add(source);
				source = this._sources.indexOf(source);
				var name = null;
				if (mapping.name) {
					name = section.consumer._names.at(mapping.name);
					this._names.add(name);
					name = this._names.indexOf(name);
				}
				var adjustedMapping = {
					source,
					generatedLine: mapping.generatedLine + (section.generatedOffset.generatedLine - 1),
					generatedColumn: mapping.generatedColumn + (section.generatedOffset.generatedLine === mapping.generatedLine ? section.generatedOffset.generatedColumn - 1 : 0),
					originalLine: mapping.originalLine,
					originalColumn: mapping.originalColumn,
					name
				};
				this.__generatedMappings.push(adjustedMapping);
				if (typeof adjustedMapping.originalLine === "number") this.__originalMappings.push(adjustedMapping);
			}
		}
		quickSort(this.__generatedMappings, util$1.compareByGeneratedPositionsDeflated);
		quickSort(this.__originalMappings, util$1.compareByOriginalPositions);
	};
	exports.IndexedSourceMapConsumer = IndexedSourceMapConsumer;
}));
var require_source_node = /* @__PURE__ */ __commonJSMin(((exports) => {
	var SourceMapGenerator = require_source_map_generator().SourceMapGenerator;
	var util = require_util();
	var REGEX_NEWLINE = /(\r?\n)/;
	var NEWLINE_CODE = 10;
	var isSourceNode = "$$$isSourceNode$$$";
	function SourceNode$1(aLine, aColumn, aSource, aChunks, aName) {
		this.children = [];
		this.sourceContents = {};
		this.line = aLine == null ? null : aLine;
		this.column = aColumn == null ? null : aColumn;
		this.source = aSource == null ? null : aSource;
		this.name = aName == null ? null : aName;
		this[isSourceNode] = true;
		if (aChunks != null) this.add(aChunks);
	}
	SourceNode$1.fromStringWithSourceMap = function SourceNode_fromStringWithSourceMap(aGeneratedCode, aSourceMapConsumer, aRelativePath) {
		var node = new SourceNode$1();
		var remainingLines = aGeneratedCode.split(REGEX_NEWLINE);
		var remainingLinesIndex = 0;
		var shiftNextLine = function() {
			return getNextLine() + (getNextLine() || "");
			function getNextLine() {
				return remainingLinesIndex < remainingLines.length ? remainingLines[remainingLinesIndex++] : void 0;
			}
		};
		var lastGeneratedLine = 1, lastGeneratedColumn = 0;
		var lastMapping = null;
		aSourceMapConsumer.eachMapping(function(mapping) {
			if (lastMapping !== null) if (lastGeneratedLine < mapping.generatedLine) {
				addMappingWithCode(lastMapping, shiftNextLine());
				lastGeneratedLine++;
				lastGeneratedColumn = 0;
			} else {
				var nextLine = remainingLines[remainingLinesIndex] || "";
				var code = nextLine.substr(0, mapping.generatedColumn - lastGeneratedColumn);
				remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn - lastGeneratedColumn);
				lastGeneratedColumn = mapping.generatedColumn;
				addMappingWithCode(lastMapping, code);
				lastMapping = mapping;
				return;
			}
			while (lastGeneratedLine < mapping.generatedLine) {
				node.add(shiftNextLine());
				lastGeneratedLine++;
			}
			if (lastGeneratedColumn < mapping.generatedColumn) {
				var nextLine = remainingLines[remainingLinesIndex] || "";
				node.add(nextLine.substr(0, mapping.generatedColumn));
				remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn);
				lastGeneratedColumn = mapping.generatedColumn;
			}
			lastMapping = mapping;
		}, this);
		if (remainingLinesIndex < remainingLines.length) {
			if (lastMapping) addMappingWithCode(lastMapping, shiftNextLine());
			node.add(remainingLines.splice(remainingLinesIndex).join(""));
		}
		aSourceMapConsumer.sources.forEach(function(sourceFile) {
			var content = aSourceMapConsumer.sourceContentFor(sourceFile);
			if (content != null) {
				if (aRelativePath != null) sourceFile = util.join(aRelativePath, sourceFile);
				node.setSourceContent(sourceFile, content);
			}
		});
		return node;
		function addMappingWithCode(mapping, code) {
			if (mapping === null || mapping.source === void 0) node.add(code);
			else {
				var source = aRelativePath ? util.join(aRelativePath, mapping.source) : mapping.source;
				node.add(new SourceNode$1(mapping.originalLine, mapping.originalColumn, source, code, mapping.name));
			}
		}
	};
	SourceNode$1.prototype.add = function SourceNode_add(aChunk) {
		if (Array.isArray(aChunk)) aChunk.forEach(function(chunk) {
			this.add(chunk);
		}, this);
		else if (aChunk[isSourceNode] || typeof aChunk === "string") {
			if (aChunk) this.children.push(aChunk);
		} else throw new TypeError("Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk);
		return this;
	};
	SourceNode$1.prototype.prepend = function SourceNode_prepend(aChunk) {
		if (Array.isArray(aChunk)) for (var i = aChunk.length - 1; i >= 0; i--) this.prepend(aChunk[i]);
		else if (aChunk[isSourceNode] || typeof aChunk === "string") this.children.unshift(aChunk);
		else throw new TypeError("Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk);
		return this;
	};
	SourceNode$1.prototype.walk = function SourceNode_walk(aFn) {
		var chunk;
		for (var i = 0, len = this.children.length; i < len; i++) {
			chunk = this.children[i];
			if (chunk[isSourceNode]) chunk.walk(aFn);
			else if (chunk !== "") aFn(chunk, {
				source: this.source,
				line: this.line,
				column: this.column,
				name: this.name
			});
		}
	};
	SourceNode$1.prototype.join = function SourceNode_join(aSep) {
		var newChildren;
		var i;
		var len = this.children.length;
		if (len > 0) {
			newChildren = [];
			for (i = 0; i < len - 1; i++) {
				newChildren.push(this.children[i]);
				newChildren.push(aSep);
			}
			newChildren.push(this.children[i]);
			this.children = newChildren;
		}
		return this;
	};
	SourceNode$1.prototype.replaceRight = function SourceNode_replaceRight(aPattern, aReplacement) {
		var lastChild = this.children[this.children.length - 1];
		if (lastChild[isSourceNode]) lastChild.replaceRight(aPattern, aReplacement);
		else if (typeof lastChild === "string") this.children[this.children.length - 1] = lastChild.replace(aPattern, aReplacement);
		else this.children.push("".replace(aPattern, aReplacement));
		return this;
	};
	SourceNode$1.prototype.setSourceContent = function SourceNode_setSourceContent(aSourceFile, aSourceContent) {
		this.sourceContents[util.toSetString(aSourceFile)] = aSourceContent;
	};
	SourceNode$1.prototype.walkSourceContents = function SourceNode_walkSourceContents(aFn) {
		for (var i = 0, len = this.children.length; i < len; i++) if (this.children[i][isSourceNode]) this.children[i].walkSourceContents(aFn);
		var sources = Object.keys(this.sourceContents);
		for (var i = 0, len = sources.length; i < len; i++) aFn(util.fromSetString(sources[i]), this.sourceContents[sources[i]]);
	};
	SourceNode$1.prototype.toString = function SourceNode_toString() {
		var str = "";
		this.walk(function(chunk) {
			str += chunk;
		});
		return str;
	};
	SourceNode$1.prototype.toStringWithSourceMap = function SourceNode_toStringWithSourceMap(aArgs) {
		var generated = {
			code: "",
			line: 1,
			column: 0
		};
		var map$2 = new SourceMapGenerator(aArgs);
		var sourceMappingActive = false;
		var lastOriginalSource = null;
		var lastOriginalLine = null;
		var lastOriginalColumn = null;
		var lastOriginalName = null;
		this.walk(function(chunk, original) {
			generated.code += chunk;
			if (original.source !== null && original.line !== null && original.column !== null) {
				if (lastOriginalSource !== original.source || lastOriginalLine !== original.line || lastOriginalColumn !== original.column || lastOriginalName !== original.name) map$2.addMapping({
					source: original.source,
					original: {
						line: original.line,
						column: original.column
					},
					generated: {
						line: generated.line,
						column: generated.column
					},
					name: original.name
				});
				lastOriginalSource = original.source;
				lastOriginalLine = original.line;
				lastOriginalColumn = original.column;
				lastOriginalName = original.name;
				sourceMappingActive = true;
			} else if (sourceMappingActive) {
				map$2.addMapping({ generated: {
					line: generated.line,
					column: generated.column
				} });
				lastOriginalSource = null;
				sourceMappingActive = false;
			}
			for (var idx = 0, length = chunk.length; idx < length; idx++) if (chunk.charCodeAt(idx) === NEWLINE_CODE) {
				generated.line++;
				generated.column = 0;
				if (idx + 1 === length) {
					lastOriginalSource = null;
					sourceMappingActive = false;
				} else if (sourceMappingActive) map$2.addMapping({
					source: original.source,
					original: {
						line: original.line,
						column: original.column
					},
					generated: {
						line: generated.line,
						column: generated.column
					},
					name: original.name
				});
			} else generated.column++;
		});
		this.walkSourceContents(function(sourceFile, sourceContent) {
			map$2.setSourceContent(sourceFile, sourceContent);
		});
		return {
			code: generated.code,
			map: map$2
		};
	};
	exports.SourceNode = SourceNode$1;
}));
var require_source_map = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.SourceMapGenerator = require_source_map_generator().SourceMapGenerator;
	exports.SourceMapConsumer = require_source_map_consumer().SourceMapConsumer;
	exports.SourceNode = require_source_node().SourceNode;
}));
var require_code_gen = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	exports.__esModule = true;
	var _utils$1 = require_utils();
	var SourceNode = void 0;
	try {
		/* istanbul ignore next */
		if (typeof define !== "function" || !define.amd) SourceNode = require_source_map().SourceNode;
	} catch (err) {}
	/* istanbul ignore if: tested but not covered in istanbul due to dist build  */
	if (!SourceNode) {
		SourceNode = function(line, column, srcFile, chunks) {
			this.src = "";
			if (chunks) this.add(chunks);
		};
		/* istanbul ignore next */
		SourceNode.prototype = {
			add: function add(chunks) {
				if (_utils$1.isArray(chunks)) chunks = chunks.join("");
				this.src += chunks;
			},
			prepend: function prepend$1(chunks) {
				if (_utils$1.isArray(chunks)) chunks = chunks.join("");
				this.src = chunks + this.src;
			},
			toStringWithSourceMap: function toStringWithSourceMap() {
				return { code: this.toString() };
			},
			toString: function toString$3() {
				return this.src;
			}
		};
	}
	function castChunk(chunk, codeGen, loc) {
		if (_utils$1.isArray(chunk)) {
			var ret = [];
			for (var i = 0, len = chunk.length; i < len; i++) ret.push(codeGen.wrap(chunk[i], loc));
			return ret;
		} else if (typeof chunk === "boolean" || typeof chunk === "number") return chunk + "";
		return chunk;
	}
	function CodeGen(srcFile) {
		this.srcFile = srcFile;
		this.source = [];
	}
	CodeGen.prototype = {
		isEmpty: function isEmpty$3() {
			return !this.source.length;
		},
		prepend: function prepend$1(source, loc) {
			this.source.unshift(this.wrap(source, loc));
		},
		push: function push$1(source, loc) {
			this.source.push(this.wrap(source, loc));
		},
		merge: function merge$1() {
			var source = this.empty();
			this.each(function(line) {
				source.add([
					"  ",
					line,
					"\n"
				]);
			});
			return source;
		},
		each: function each(iter) {
			for (var i = 0, len = this.source.length; i < len; i++) iter(this.source[i]);
		},
		empty: function empty() {
			var loc = this.currentLocation || { start: {} };
			return new SourceNode(loc.start.line, loc.start.column, this.srcFile);
		},
		wrap: function wrap(chunk) {
			var loc = arguments.length <= 1 || arguments[1] === void 0 ? this.currentLocation || { start: {} } : arguments[1];
			if (chunk instanceof SourceNode) return chunk;
			chunk = castChunk(chunk, this, loc);
			return new SourceNode(loc.start.line, loc.start.column, this.srcFile, chunk);
		},
		functionCall: function functionCall(fn, type, params) {
			params = this.generateList(params);
			return this.wrap([
				fn,
				type ? "." + type + "(" : "(",
				params,
				")"
			]);
		},
		quotedString: function quotedString$1(str) {
			return "\"" + (str + "").replace(/\\/g, "\\\\").replace(/"/g, "\\\"").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029") + "\"";
		},
		objectLiteral: function objectLiteral(obj) {
			// istanbul ignore next
			var _this = this;
			var pairs$1 = [];
			Object.keys(obj).forEach(function(key) {
				var value = castChunk(obj[key], _this);
				if (value !== "undefined") pairs$1.push([
					_this.quotedString(key),
					":",
					value
				]);
			});
			var ret = this.generateList(pairs$1);
			ret.prepend("{");
			ret.add("}");
			return ret;
		},
		generateList: function generateList(entries) {
			var ret = this.empty();
			for (var i = 0, len = entries.length; i < len; i++) {
				if (i) ret.add(",");
				ret.add(castChunk(entries[i], this));
			}
			return ret;
		},
		generateArray: function generateArray(entries) {
			var ret = this.generateList(entries);
			ret.prepend("[");
			ret.add("]");
			return ret;
		}
	};
	exports["default"] = CodeGen;
	module.exports = exports["default"];
}));
var require_javascript_compiler = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	exports.__esModule = true;
	// istanbul ignore next
	function _interopRequireDefault$2(obj) {
		return obj && obj.__esModule ? obj : { "default": obj };
	}
	var _base = require_base$1();
	var _exception2 = _interopRequireDefault$2(require_exception());
	var _utils = require_utils();
	var _codeGen2 = _interopRequireDefault$2(require_code_gen());
	function Literal(value) {
		this.value = value;
	}
	function JavaScriptCompiler() {}
	JavaScriptCompiler.prototype = {
		nameLookup: function nameLookup(parent, name) {
			return this.internalNameLookup(parent, name);
		},
		depthedLookup: function depthedLookup(name) {
			return [
				this.aliasable("container.lookup"),
				"(depths, ",
				JSON.stringify(name),
				")"
			];
		},
		compilerInfo: function compilerInfo() {
			var revision = _base.COMPILER_REVISION;
			return [revision, _base.REVISION_CHANGES[revision]];
		},
		appendToBuffer: function appendToBuffer(source, location, explicit) {
			if (!_utils.isArray(source)) source = [source];
			source = this.source.wrap(source, location);
			if (this.environment.isSimple) return [
				"return ",
				source,
				";"
			];
			else if (explicit) return [
				"buffer += ",
				source,
				";"
			];
			else {
				source.appendToBuffer = true;
				return source;
			}
		},
		initializeBuffer: function initializeBuffer() {
			return this.quotedString("");
		},
		internalNameLookup: function internalNameLookup(parent, name) {
			this.lookupPropertyFunctionIsUsed = true;
			return [
				"lookupProperty(",
				parent,
				",",
				JSON.stringify(name),
				")"
			];
		},
		lookupPropertyFunctionIsUsed: false,
		compile: function compile$1(environment, options, context, asObject) {
			this.environment = environment;
			this.options = options;
			this.stringParams = this.options.stringParams;
			this.trackIds = this.options.trackIds;
			this.precompile = !asObject;
			this.name = this.environment.name;
			this.isChild = !!context;
			this.context = context || {
				decorators: [],
				programs: [],
				environments: []
			};
			this.preamble();
			this.stackSlot = 0;
			this.stackVars = [];
			this.aliases = {};
			this.registers = { list: [] };
			this.hashes = [];
			this.compileStack = [];
			this.inlineStack = [];
			this.blockParams = [];
			this.compileChildren(environment, options);
			this.useDepths = this.useDepths || environment.useDepths || environment.useDecorators || this.options.compat;
			this.useBlockParams = this.useBlockParams || environment.useBlockParams;
			var opcodes = environment.opcodes, opcode = void 0, firstLoc = void 0, i = void 0, l = void 0;
			for (i = 0, l = opcodes.length; i < l; i++) {
				opcode = opcodes[i];
				this.source.currentLocation = opcode.loc;
				firstLoc = firstLoc || opcode.loc;
				this[opcode.opcode].apply(this, opcode.args);
			}
			this.source.currentLocation = firstLoc;
			this.pushSource("");
			/* istanbul ignore next */
			if (this.stackSlot || this.inlineStack.length || this.compileStack.length) throw new _exception2["default"]("Compile completed with content left on stack");
			if (!this.decorators.isEmpty()) {
				this.useDecorators = true;
				this.decorators.prepend([
					"var decorators = container.decorators, ",
					this.lookupPropertyFunctionVarDeclaration(),
					";\n"
				]);
				this.decorators.push("return fn;");
				if (asObject) this.decorators = Function.apply(this, [
					"fn",
					"props",
					"container",
					"depth0",
					"data",
					"blockParams",
					"depths",
					this.decorators.merge()
				]);
				else {
					this.decorators.prepend("function(fn, props, container, depth0, data, blockParams, depths) {\n");
					this.decorators.push("}\n");
					this.decorators = this.decorators.merge();
				}
			} else this.decorators = void 0;
			var fn = this.createFunctionContext(asObject);
			if (!this.isChild) {
				var ret = {
					compiler: this.compilerInfo(),
					main: fn
				};
				if (this.decorators) {
					ret.main_d = this.decorators;
					ret.useDecorators = true;
				}
				var _context = this.context;
				var programs = _context.programs;
				var decorators = _context.decorators;
				for (i = 0, l = programs.length; i < l; i++) if (programs[i]) {
					ret[i] = programs[i];
					if (decorators[i]) {
						ret[i + "_d"] = decorators[i];
						ret.useDecorators = true;
					}
				}
				if (this.environment.usePartial) ret.usePartial = true;
				if (this.options.data) ret.useData = true;
				if (this.useDepths) ret.useDepths = true;
				if (this.useBlockParams) ret.useBlockParams = true;
				if (this.options.compat) ret.compat = true;
				if (!asObject) {
					ret.compiler = JSON.stringify(ret.compiler);
					this.source.currentLocation = { start: {
						line: 1,
						column: 0
					} };
					ret = this.objectLiteral(ret);
					if (options.srcName) {
						ret = ret.toStringWithSourceMap({ file: options.destName });
						ret.map = ret.map && ret.map.toString();
					} else ret = ret.toString();
				} else ret.compilerOptions = this.options;
				return ret;
			} else return fn;
		},
		preamble: function preamble() {
			this.lastContext = 0;
			this.source = new _codeGen2["default"](this.options.srcName);
			this.decorators = new _codeGen2["default"](this.options.srcName);
		},
		createFunctionContext: function createFunctionContext(asObject) {
			// istanbul ignore next
			var _this = this;
			var varDeclarations = "";
			var locals = this.stackVars.concat(this.registers.list);
			if (locals.length > 0) varDeclarations += ", " + locals.join(", ");
			var aliasCount = 0;
			Object.keys(this.aliases).forEach(function(alias) {
				var node = _this.aliases[alias];
				if (node.children && node.referenceCount > 1) {
					varDeclarations += ", alias" + ++aliasCount + "=" + alias;
					node.children[0] = "alias" + aliasCount;
				}
			});
			if (this.lookupPropertyFunctionIsUsed) varDeclarations += ", " + this.lookupPropertyFunctionVarDeclaration();
			var params = [
				"container",
				"depth0",
				"helpers",
				"partials",
				"data"
			];
			if (this.useBlockParams || this.useDepths) params.push("blockParams");
			if (this.useDepths) params.push("depths");
			var source = this.mergeSource(varDeclarations);
			if (asObject) {
				params.push(source);
				return Function.apply(this, params);
			} else return this.source.wrap([
				"function(",
				params.join(","),
				") {\n  ",
				source,
				"}"
			]);
		},
		mergeSource: function mergeSource(varDeclarations) {
			var isSimple = this.environment.isSimple, appendOnly = !this.forceBuffer, appendFirst = void 0, sourceSeen = void 0, bufferStart = void 0, bufferEnd = void 0;
			this.source.each(function(line) {
				if (line.appendToBuffer) {
					if (bufferStart) line.prepend("  + ");
					else bufferStart = line;
					bufferEnd = line;
				} else {
					if (bufferStart) {
						if (!sourceSeen) appendFirst = true;
						else bufferStart.prepend("buffer += ");
						bufferEnd.add(";");
						bufferStart = bufferEnd = void 0;
					}
					sourceSeen = true;
					if (!isSimple) appendOnly = false;
				}
			});
			if (appendOnly) {
				if (bufferStart) {
					bufferStart.prepend("return ");
					bufferEnd.add(";");
				} else if (!sourceSeen) this.source.push("return \"\";");
			} else {
				varDeclarations += ", buffer = " + (appendFirst ? "" : this.initializeBuffer());
				if (bufferStart) {
					bufferStart.prepend("return buffer + ");
					bufferEnd.add(";");
				} else this.source.push("return buffer;");
			}
			if (varDeclarations) this.source.prepend("var " + varDeclarations.substring(2) + (appendFirst ? "" : ";\n"));
			return this.source.merge();
		},
		lookupPropertyFunctionVarDeclaration: function lookupPropertyFunctionVarDeclaration() {
			return "\n      lookupProperty = container.lookupProperty || function(parent, propertyName) {\n        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {\n          return parent[propertyName];\n        }\n        return undefined\n    }\n    ".trim();
		},
		blockValue: function blockValue(name) {
			var blockHelperMissing = this.aliasable("container.hooks.blockHelperMissing"), params = [this.contextName(0)];
			this.setupHelperArgs(name, 0, params);
			var blockName = this.popStack();
			params.splice(1, 0, blockName);
			this.push(this.source.functionCall(blockHelperMissing, "call", params));
		},
		ambiguousBlockValue: function ambiguousBlockValue() {
			var blockHelperMissing = this.aliasable("container.hooks.blockHelperMissing"), params = [this.contextName(0)];
			this.setupHelperArgs("", 0, params, true);
			this.flushInline();
			var current = this.topStack();
			params.splice(1, 0, current);
			this.pushSource([
				"if (!",
				this.lastHelper,
				") { ",
				current,
				" = ",
				this.source.functionCall(blockHelperMissing, "call", params),
				"}"
			]);
		},
		appendContent: function appendContent(content) {
			if (this.pendingContent) content = this.pendingContent + content;
			else this.pendingLocation = this.source.currentLocation;
			this.pendingContent = content;
		},
		append: function append$1() {
			if (this.isInline()) {
				this.replaceStack(function(current) {
					return [
						" != null ? ",
						current,
						" : \"\""
					];
				});
				this.pushSource(this.appendToBuffer(this.popStack()));
			} else {
				var local = this.popStack();
				this.pushSource([
					"if (",
					local,
					" != null) { ",
					this.appendToBuffer(local, void 0, true),
					" }"
				]);
				if (this.environment.isSimple) this.pushSource([
					"else { ",
					this.appendToBuffer("''", void 0, true),
					" }"
				]);
			}
		},
		appendEscaped: function appendEscaped() {
			this.pushSource(this.appendToBuffer([
				this.aliasable("container.escapeExpression"),
				"(",
				this.popStack(),
				")"
			]));
		},
		getContext: function getContext(depth) {
			this.lastContext = depth;
		},
		pushContext: function pushContext() {
			this.pushStackLiteral(this.contextName(this.lastContext));
		},
		lookupOnContext: function lookupOnContext(parts, falsy, strict, scoped) {
			var i = 0;
			if (!scoped && this.options.compat && !this.lastContext) this.push(this.depthedLookup(parts[i++]));
			else this.pushContext();
			this.resolvePath("context", parts, i, falsy, strict);
		},
		lookupBlockParam: function lookupBlockParam(blockParamId, parts) {
			this.useBlockParams = true;
			this.push([
				"blockParams[",
				blockParamId[0],
				"][",
				blockParamId[1],
				"]"
			]);
			this.resolvePath("context", parts, 1);
		},
		lookupData: function lookupData(depth, parts, strict) {
			if (!depth) this.pushStackLiteral("data");
			else this.pushStackLiteral("container.data(data, " + depth + ")");
			this.resolvePath("data", parts, 0, true, strict);
		},
		resolvePath: function resolvePath(type, parts, i, falsy, strict) {
			// istanbul ignore next
			var _this2 = this;
			if (this.options.strict || this.options.assumeObjects) {
				this.push(strictLookup(this.options.strict && strict, this, parts, i, type));
				return;
			}
			var len = parts.length;
			for (; i < len; i++) this.replaceStack(function(current) {
				var lookup = _this2.nameLookup(current, parts[i], type);
				if (!falsy) return [
					" != null ? ",
					lookup,
					" : ",
					current
				];
				else return [" && ", lookup];
			});
		},
		resolvePossibleLambda: function resolvePossibleLambda() {
			this.push([
				this.aliasable("container.lambda"),
				"(",
				this.popStack(),
				", ",
				this.contextName(0),
				")"
			]);
		},
		pushStringParam: function pushStringParam(string$1, type) {
			this.pushContext();
			this.pushString(type);
			if (type !== "SubExpression") if (typeof string$1 === "string") this.pushString(string$1);
			else this.pushStackLiteral(string$1);
		},
		emptyHash: function emptyHash(omitEmpty) {
			if (this.trackIds) this.push("{}");
			if (this.stringParams) {
				this.push("{}");
				this.push("{}");
			}
			this.pushStackLiteral(omitEmpty ? "undefined" : "{}");
		},
		pushHash: function pushHash() {
			if (this.hash) this.hashes.push(this.hash);
			this.hash = {
				values: {},
				types: [],
				contexts: [],
				ids: []
			};
		},
		popHash: function popHash() {
			var hash = this.hash;
			this.hash = this.hashes.pop();
			if (this.trackIds) this.push(this.objectLiteral(hash.ids));
			if (this.stringParams) {
				this.push(this.objectLiteral(hash.contexts));
				this.push(this.objectLiteral(hash.types));
			}
			this.push(this.objectLiteral(hash.values));
		},
		pushString: function pushString(string$1) {
			this.pushStackLiteral(this.quotedString(string$1));
		},
		pushLiteral: function pushLiteral(value) {
			this.pushStackLiteral(value);
		},
		pushProgram: function pushProgram(guid) {
			if (guid != null) this.pushStackLiteral(this.programExpression(guid));
			else this.pushStackLiteral(null);
		},
		registerDecorator: function registerDecorator(paramSize, name) {
			var foundDecorator = this.nameLookup("decorators", name, "decorator"), options = this.setupHelperArgs(name, paramSize);
			this.decorators.push([
				"fn = ",
				this.decorators.functionCall(foundDecorator, "", [
					"fn",
					"props",
					"container",
					options
				]),
				" || fn;"
			]);
		},
		invokeHelper: function invokeHelper(paramSize, name, isSimple) {
			var nonHelper = this.popStack(), helper = this.setupHelper(paramSize, name);
			var possibleFunctionCalls = [];
			if (isSimple) possibleFunctionCalls.push(helper.name);
			possibleFunctionCalls.push(nonHelper);
			if (!this.options.strict) possibleFunctionCalls.push(this.aliasable("container.hooks.helperMissing"));
			var functionLookupCode = [
				"(",
				this.itemsSeparatedBy(possibleFunctionCalls, "||"),
				")"
			];
			var functionCall = this.source.functionCall(functionLookupCode, "call", helper.callParams);
			this.push(functionCall);
		},
		itemsSeparatedBy: function itemsSeparatedBy(items, separator) {
			var result = [];
			result.push(items[0]);
			for (var i = 1; i < items.length; i++) result.push(separator, items[i]);
			return result;
		},
		invokeKnownHelper: function invokeKnownHelper(paramSize, name) {
			var helper = this.setupHelper(paramSize, name);
			this.push(this.source.functionCall(helper.name, "call", helper.callParams));
		},
		invokeAmbiguous: function invokeAmbiguous(name, helperCall) {
			this.useRegister("helper");
			var nonHelper = this.popStack();
			this.emptyHash();
			var helper = this.setupHelper(0, name, helperCall);
			var lookup = [
				"(",
				"(helper = ",
				this.lastHelper = this.nameLookup("helpers", name, "helper"),
				" || ",
				nonHelper,
				")"
			];
			if (!this.options.strict) {
				lookup[0] = "(helper = ";
				lookup.push(" != null ? helper : ", this.aliasable("container.hooks.helperMissing"));
			}
			this.push([
				"(",
				lookup,
				helper.paramsInit ? ["),(", helper.paramsInit] : [],
				"),",
				"(typeof helper === ",
				this.aliasable("\"function\""),
				" ? ",
				this.source.functionCall("helper", "call", helper.callParams),
				" : helper))"
			]);
		},
		invokePartial: function invokePartial$1(isDynamic, name, indent) {
			var params = [], options = this.setupParams(name, 1, params);
			if (isDynamic) {
				name = this.popStack();
				delete options.name;
			}
			if (indent) options.indent = JSON.stringify(indent);
			options.helpers = "helpers";
			options.partials = "partials";
			options.decorators = "container.decorators";
			if (!isDynamic) params.unshift(this.nameLookup("partials", name, "partial"));
			else params.unshift(name);
			if (this.options.compat) options.depths = "depths";
			options = this.objectLiteral(options);
			params.push(options);
			this.push(this.source.functionCall("container.invokePartial", "", params));
		},
		assignToHash: function assignToHash(key) {
			var value = this.popStack(), context = void 0, type = void 0, id$1 = void 0;
			if (this.trackIds) id$1 = this.popStack();
			if (this.stringParams) {
				type = this.popStack();
				context = this.popStack();
			}
			var hash = this.hash;
			if (context) hash.contexts[key] = context;
			if (type) hash.types[key] = type;
			if (id$1) hash.ids[key] = id$1;
			hash.values[key] = value;
		},
		pushId: function pushId(type, name, child) {
			if (type === "BlockParam") this.pushStackLiteral("blockParams[" + name[0] + "].path[" + name[1] + "]" + (child ? " + " + JSON.stringify("." + child) : ""));
			else if (type === "PathExpression") this.pushString(name);
			else if (type === "SubExpression") this.pushStackLiteral("true");
			else this.pushStackLiteral("null");
		},
		compiler: JavaScriptCompiler,
		compileChildren: function compileChildren(environment, options) {
			var children = environment.children, child = void 0, compiler = void 0;
			for (var i = 0, l = children.length; i < l; i++) {
				child = children[i];
				compiler = new this.compiler();
				var existing = this.matchExistingProgram(child);
				if (existing == null) {
					this.context.programs.push("");
					var index = this.context.programs.length;
					child.index = index;
					child.name = "program" + index;
					this.context.programs[index] = compiler.compile(child, options, this.context, !this.precompile);
					this.context.decorators[index] = compiler.decorators;
					this.context.environments[index] = child;
					this.useDepths = this.useDepths || compiler.useDepths;
					this.useBlockParams = this.useBlockParams || compiler.useBlockParams;
					child.useDepths = this.useDepths;
					child.useBlockParams = this.useBlockParams;
				} else {
					child.index = existing.index;
					child.name = "program" + existing.index;
					this.useDepths = this.useDepths || existing.useDepths;
					this.useBlockParams = this.useBlockParams || existing.useBlockParams;
				}
			}
		},
		matchExistingProgram: function matchExistingProgram(child) {
			for (var i = 0, len = this.context.environments.length; i < len; i++) {
				var environment = this.context.environments[i];
				if (environment && environment.equals(child)) return environment;
			}
		},
		programExpression: function programExpression(guid) {
			var child = this.environment.children[guid], programParams = [
				child.index,
				"data",
				child.blockParams
			];
			if (this.useBlockParams || this.useDepths) programParams.push("blockParams");
			if (this.useDepths) programParams.push("depths");
			return "container.program(" + programParams.join(", ") + ")";
		},
		useRegister: function useRegister(name) {
			if (!this.registers[name]) {
				this.registers[name] = true;
				this.registers.list.push(name);
			}
		},
		push: function push$1(expr) {
			if (!(expr instanceof Literal)) expr = this.source.wrap(expr);
			this.inlineStack.push(expr);
			return expr;
		},
		pushStackLiteral: function pushStackLiteral(item) {
			this.push(new Literal(item));
		},
		pushSource: function pushSource(source) {
			if (this.pendingContent) {
				this.source.push(this.appendToBuffer(this.source.quotedString(this.pendingContent), this.pendingLocation));
				this.pendingContent = void 0;
			}
			if (source) this.source.push(source);
		},
		replaceStack: function replaceStack(callback) {
			var prefix = ["("], stack = void 0, createdStack = void 0, usedLiteral = void 0;
			/* istanbul ignore next */
			if (!this.isInline()) throw new _exception2["default"]("replaceStack on non-inline");
			var top = this.popStack(true);
			if (top instanceof Literal) {
				stack = [top.value];
				prefix = ["(", stack];
				usedLiteral = true;
			} else {
				createdStack = true;
				var _name = this.incrStack();
				prefix = [
					"((",
					this.push(_name),
					" = ",
					top,
					")"
				];
				stack = this.topStack();
			}
			var item = callback.call(this, stack);
			if (!usedLiteral) this.popStack();
			if (createdStack) this.stackSlot--;
			this.push(prefix.concat(item, ")"));
		},
		incrStack: function incrStack() {
			this.stackSlot++;
			if (this.stackSlot > this.stackVars.length) this.stackVars.push("stack" + this.stackSlot);
			return this.topStackName();
		},
		topStackName: function topStackName() {
			return "stack" + this.stackSlot;
		},
		flushInline: function flushInline() {
			var inlineStack = this.inlineStack;
			this.inlineStack = [];
			for (var i = 0, len = inlineStack.length; i < len; i++) {
				var entry = inlineStack[i];
				/* istanbul ignore if */
				if (entry instanceof Literal) this.compileStack.push(entry);
				else {
					var stack = this.incrStack();
					this.pushSource([
						stack,
						" = ",
						entry,
						";"
					]);
					this.compileStack.push(stack);
				}
			}
		},
		isInline: function isInline() {
			return this.inlineStack.length;
		},
		popStack: function popStack(wrapped) {
			var inline = this.isInline(), item = (inline ? this.inlineStack : this.compileStack).pop();
			if (!wrapped && item instanceof Literal) return item.value;
			else {
				if (!inline) {
					/* istanbul ignore next */
					if (!this.stackSlot) throw new _exception2["default"]("Invalid stack pop");
					this.stackSlot--;
				}
				return item;
			}
		},
		topStack: function topStack() {
			var stack = this.isInline() ? this.inlineStack : this.compileStack, item = stack[stack.length - 1];
			/* istanbul ignore if */
			if (item instanceof Literal) return item.value;
			else return item;
		},
		contextName: function contextName(context) {
			if (this.useDepths && context) return "depths[" + context + "]";
			else return "depth" + context;
		},
		quotedString: function quotedString$1(str) {
			return this.source.quotedString(str);
		},
		objectLiteral: function objectLiteral(obj) {
			return this.source.objectLiteral(obj);
		},
		aliasable: function aliasable(name) {
			var ret = this.aliases[name];
			if (ret) {
				ret.referenceCount++;
				return ret;
			}
			ret = this.aliases[name] = this.source.wrap(name);
			ret.aliasable = true;
			ret.referenceCount = 1;
			return ret;
		},
		setupHelper: function setupHelper(paramSize, name, blockHelper) {
			var params = [];
			return {
				params,
				paramsInit: this.setupHelperArgs(name, paramSize, params, blockHelper),
				name: this.nameLookup("helpers", name, "helper"),
				callParams: [this.aliasable(this.contextName(0) + " != null ? " + this.contextName(0) + " : (container.nullContext || {})")].concat(params)
			};
		},
		setupParams: function setupParams(helper, paramSize, params) {
			var options = {}, contexts = [], types = [], ids = [], objectArgs = !params, param = void 0;
			if (objectArgs) params = [];
			options.name = this.quotedString(helper);
			options.hash = this.popStack();
			if (this.trackIds) options.hashIds = this.popStack();
			if (this.stringParams) {
				options.hashTypes = this.popStack();
				options.hashContexts = this.popStack();
			}
			var inverse = this.popStack(), program = this.popStack();
			if (program || inverse) {
				options.fn = program || "container.noop";
				options.inverse = inverse || "container.noop";
			}
			var i = paramSize;
			while (i--) {
				param = this.popStack();
				params[i] = param;
				if (this.trackIds) ids[i] = this.popStack();
				if (this.stringParams) {
					types[i] = this.popStack();
					contexts[i] = this.popStack();
				}
			}
			if (objectArgs) options.args = this.source.generateArray(params);
			if (this.trackIds) options.ids = this.source.generateArray(ids);
			if (this.stringParams) {
				options.types = this.source.generateArray(types);
				options.contexts = this.source.generateArray(contexts);
			}
			if (this.options.data) options.data = "data";
			if (this.useBlockParams) options.blockParams = "blockParams";
			return options;
		},
		setupHelperArgs: function setupHelperArgs(helper, paramSize, params, useRegister) {
			var options = this.setupParams(helper, paramSize, params);
			options.loc = JSON.stringify(this.source.currentLocation);
			options = this.objectLiteral(options);
			if (useRegister) {
				this.useRegister("options");
				params.push("options");
				return ["options=", options];
			} else if (params) {
				params.push(options);
				return "";
			} else return options;
		}
	};
	(function() {
		var reservedWords = "break else new var case finally return void catch for switch while continue function this with default if throw delete in try do instanceof typeof abstract enum int short boolean export interface static byte extends long super char final native synchronized class float package throws const goto private transient debugger implements protected volatile double import public let yield await null true false".split(" ");
		var compilerWords = JavaScriptCompiler.RESERVED_WORDS = {};
		for (var i = 0, l = reservedWords.length; i < l; i++) compilerWords[reservedWords[i]] = true;
	})();
	JavaScriptCompiler.isValidJavaScriptVariableName = function(name) {
		return !JavaScriptCompiler.RESERVED_WORDS[name] && /^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(name);
	};
	function strictLookup(requireTerminal, compiler, parts, i, type) {
		var stack = compiler.popStack(), len = parts.length;
		if (requireTerminal) len--;
		for (; i < len; i++) stack = compiler.nameLookup(stack, parts[i], type);
		if (requireTerminal) return [
			compiler.aliasable("container.strict"),
			"(",
			stack,
			", ",
			compiler.quotedString(parts[i]),
			", ",
			JSON.stringify(compiler.source.currentLocation),
			" )"
		];
		else return stack;
	}
	exports["default"] = JavaScriptCompiler;
	module.exports = exports["default"];
}));
var require_handlebars = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	exports.__esModule = true;
	// istanbul ignore next
	function _interopRequireDefault$1(obj) {
		return obj && obj.__esModule ? obj : { "default": obj };
	}
	var _handlebarsRuntime2 = _interopRequireDefault$1(require_handlebars_runtime());
	var _handlebarsCompilerAst2 = _interopRequireDefault$1(require_ast());
	var _handlebarsCompilerBase = require_base();
	var _handlebarsCompilerCompiler = require_compiler();
	var _handlebarsCompilerJavascriptCompiler2 = _interopRequireDefault$1(require_javascript_compiler());
	var _handlebarsCompilerVisitor2 = _interopRequireDefault$1(require_visitor());
	var _handlebarsNoConflict2 = _interopRequireDefault$1(require_no_conflict());
	var _create = _handlebarsRuntime2["default"].create;
	function create() {
		var hb = _create();
		hb.compile = function(input, options) {
			return _handlebarsCompilerCompiler.compile(input, options, hb);
		};
		hb.precompile = function(input, options) {
			return _handlebarsCompilerCompiler.precompile(input, options, hb);
		};
		hb.AST = _handlebarsCompilerAst2["default"];
		hb.Compiler = _handlebarsCompilerCompiler.Compiler;
		hb.JavaScriptCompiler = _handlebarsCompilerJavascriptCompiler2["default"];
		hb.Parser = _handlebarsCompilerBase.parser;
		hb.parse = _handlebarsCompilerBase.parse;
		hb.parseWithoutProcessing = _handlebarsCompilerBase.parseWithoutProcessing;
		return hb;
	}
	var inst = create();
	inst.create = create;
	_handlebarsNoConflict2["default"](inst);
	inst.Visitor = _handlebarsCompilerVisitor2["default"];
	inst["default"] = inst;
	exports["default"] = inst;
	module.exports = exports["default"];
}));
var require_printer = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.__esModule = true;
	exports.print = print;
	exports.PrintVisitor = PrintVisitor;
	// istanbul ignore next
	function _interopRequireDefault(obj) {
		return obj && obj.__esModule ? obj : { "default": obj };
	}
	var _visitor2 = _interopRequireDefault(require_visitor());
	function print(ast) {
		return new PrintVisitor().accept(ast);
	}
	function PrintVisitor() {
		this.padding = 0;
	}
	PrintVisitor.prototype = new _visitor2["default"]();
	PrintVisitor.prototype.pad = function(string$1) {
		var out = "";
		for (var i = 0, l = this.padding; i < l; i++) out += "  ";
		out += string$1 + "\n";
		return out;
	};
	PrintVisitor.prototype.Program = function(program) {
		var out = "", body = program.body, i = void 0, l = void 0;
		if (program.blockParams) {
			var blockParams$1 = "BLOCK PARAMS: [";
			for (i = 0, l = program.blockParams.length; i < l; i++) blockParams$1 += " " + program.blockParams[i];
			blockParams$1 += " ]";
			out += this.pad(blockParams$1);
		}
		for (i = 0, l = body.length; i < l; i++) out += this.accept(body[i]);
		this.padding--;
		return out;
	};
	PrintVisitor.prototype.MustacheStatement = function(mustache) {
		return this.pad("{{ " + this.SubExpression(mustache) + " }}");
	};
	PrintVisitor.prototype.Decorator = function(mustache) {
		return this.pad("{{ DIRECTIVE " + this.SubExpression(mustache) + " }}");
	};
	PrintVisitor.prototype.BlockStatement = PrintVisitor.prototype.DecoratorBlock = function(block) {
		var out = "";
		out += this.pad((block.type === "DecoratorBlock" ? "DIRECTIVE " : "") + "BLOCK:");
		this.padding++;
		out += this.pad(this.SubExpression(block));
		if (block.program) {
			out += this.pad("PROGRAM:");
			this.padding++;
			out += this.accept(block.program);
			this.padding--;
		}
		if (block.inverse) {
			if (block.program) this.padding++;
			out += this.pad("{{^}}");
			this.padding++;
			out += this.accept(block.inverse);
			this.padding--;
			if (block.program) this.padding--;
		}
		this.padding--;
		return out;
	};
	PrintVisitor.prototype.PartialStatement = function(partial) {
		var content = "PARTIAL:" + partial.name.original;
		if (partial.params[0]) content += " " + this.accept(partial.params[0]);
		if (partial.hash) content += " " + this.accept(partial.hash);
		return this.pad("{{> " + content + " }}");
	};
	PrintVisitor.prototype.PartialBlockStatement = function(partial) {
		var content = "PARTIAL BLOCK:" + partial.name.original;
		if (partial.params[0]) content += " " + this.accept(partial.params[0]);
		if (partial.hash) content += " " + this.accept(partial.hash);
		content += " " + this.pad("PROGRAM:");
		this.padding++;
		content += this.accept(partial.program);
		this.padding--;
		return this.pad("{{> " + content + " }}");
	};
	PrintVisitor.prototype.ContentStatement = function(content) {
		return this.pad("CONTENT[ '" + content.value + "' ]");
	};
	PrintVisitor.prototype.CommentStatement = function(comment) {
		return this.pad("{{! '" + comment.value + "' }}");
	};
	PrintVisitor.prototype.SubExpression = function(sexpr) {
		var params = sexpr.params, paramStrings = [], hash = void 0;
		for (var i = 0, l = params.length; i < l; i++) paramStrings.push(this.accept(params[i]));
		params = "[" + paramStrings.join(", ") + "]";
		hash = sexpr.hash ? " " + this.accept(sexpr.hash) : "";
		return this.accept(sexpr.path) + " " + params + hash;
	};
	PrintVisitor.prototype.PathExpression = function(id$1) {
		var path$1 = id$1.parts.join("/");
		return (id$1.data ? "@" : "") + "PATH:" + path$1;
	};
	PrintVisitor.prototype.StringLiteral = function(string$1) {
		return "\"" + string$1.value + "\"";
	};
	PrintVisitor.prototype.NumberLiteral = function(number) {
		return "NUMBER{" + number.value + "}";
	};
	PrintVisitor.prototype.BooleanLiteral = function(bool) {
		return "BOOLEAN{" + bool.value + "}";
	};
	PrintVisitor.prototype.UndefinedLiteral = function() {
		return "UNDEFINED";
	};
	PrintVisitor.prototype.NullLiteral = function() {
		return "NULL";
	};
	PrintVisitor.prototype.Hash = function(hash) {
		var pairs$1 = hash.pairs, joinedPairs = [];
		for (var i = 0, l = pairs$1.length; i < l; i++) joinedPairs.push(this.accept(pairs$1[i]));
		return "HASH{" + joinedPairs.join(", ") + "}";
	};
	PrintVisitor.prototype.HashPair = function(pair) {
		return pair.key + "=" + this.accept(pair.value);
	};
}));
var import_lib = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
	var handlebars = require_handlebars()["default"];
	var printer = require_printer();
	handlebars.PrintVisitor = printer.PrintVisitor;
	handlebars.print = printer.print;
	module.exports = handlebars;
	function extension(module$1, filename) {
		var templateString = __require("fs").readFileSync(filename, "utf8");
		module$1.exports = handlebars.compile(templateString);
	}
	/* istanbul ignore else */
	if (typeof __require !== "undefined" && __require.extensions) {
		__require.extensions[".handlebars"] = extension;
		__require.extensions[".hbs"] = extension;
	}
})))(), 1);
var HandlebarsTemplateEngine = class extends BaseTemplateEngine {
	constructor() {
		super();
		this.name = "handlebars";
		this.compiledTemplates = /* @__PURE__ */ new Map();
		this.handlebars = import_lib.create();
		this.registerDefaultHelpers();
	}
	async render(template$1, context) {
		try {
			let compiledTemplate = this.compiledTemplates.get(template$1);
			if (!compiledTemplate) {
				compiledTemplate = this.handlebars.compile(template$1);
				this.compiledTemplates.set(template$1, compiledTemplate);
			}
			return compiledTemplate(context);
		} catch (error) {
			throw new Error(`Handlebars render error: ${error instanceof Error ? error.message : String(error)}`);
		}
	}
	async validate(template$1) {
		try {
			this.handlebars.compile(template$1);
			return { valid: true };
		} catch (error) {
			return {
				valid: false,
				errors: [error instanceof Error ? error.message : String(error)]
			};
		}
	}
	async compile(template$1) {
		const compiled = this.handlebars.compile(template$1);
		this.compiledTemplates.set(template$1, compiled);
		return compiled;
	}
	registerHelper(name, fn) {
		this.handlebars.registerHelper(name, fn);
	}
	registerPartial(name, template$1) {
		this.handlebars.registerPartial(name, template$1);
	}
	registerDefaultHelpers() {
		this.handlebars.registerHelper("eq", (a, b) => a === b);
		this.handlebars.registerHelper("ne", (a, b) => a !== b);
		this.handlebars.registerHelper("lt", (a, b) => a < b);
		this.handlebars.registerHelper("lte", (a, b) => a <= b);
		this.handlebars.registerHelper("gt", (a, b) => a > b);
		this.handlebars.registerHelper("gte", (a, b) => a >= b);
		this.handlebars.registerHelper("and", (...args) => {
			return args.slice(0, -1).every((v) => !!v);
		});
		this.handlebars.registerHelper("or", (...args) => {
			return args.slice(0, -1).some((v) => !!v);
		});
		this.handlebars.registerHelper("not", (value) => !value);
		this.handlebars.registerHelper("length", (value) => {
			if (Array.isArray(value) || typeof value === "string") return value.length;
			return 0;
		});
		this.handlebars.registerHelper("join", (array, separator = ",") => {
			if (Array.isArray(array)) return array.join(separator);
			return "";
		});
		this.handlebars.registerHelper("upper", (str) => {
			if (typeof str === "string") return str.toUpperCase();
			return str;
		});
		this.handlebars.registerHelper("lower", (str) => {
			if (typeof str === "string") return str.toLowerCase();
			return str;
		});
		this.handlebars.registerHelper("capitalize", (str) => {
			if (typeof str === "string" && str.length > 0) return str.charAt(0).toUpperCase() + str.slice(1);
			return str;
		});
		this.handlebars.registerHelper("truncate", (str, length = 100) => {
			if (typeof str === "string" && str.length > length) return str.substring(0, length) + "...";
			return str;
		});
		this.handlebars.registerHelper("default", (value, defaultValue) => {
			return value ?? defaultValue;
		});
		this.handlebars.registerHelper("json", (obj) => {
			try {
				return JSON.stringify(obj, null, 2);
			} catch {
				return String(obj);
			}
		});
		this.handlebars.registerHelper("date", (date$1) => {
			try {
				return (date$1 instanceof Date ? date$1 : new Date(date$1)).toLocaleDateString();
			} catch {
				return String(date$1);
			}
		});
		this.handlebars.registerHelper("formatNumber", (num) => {
			if (typeof num === "number") return num.toLocaleString();
			return num;
		});
	}
	clearCache() {
		this.compiledTemplates.clear();
	}
};
var Token = class {
	constructor(kind, input, begin, end, file) {
		this.kind = kind;
		this.input = input;
		this.begin = begin;
		this.end = end;
		this.file = file;
	}
	getText() {
		return this.input.slice(this.begin, this.end);
	}
	getPosition() {
		let [row, col] = [1, 1];
		for (let i = 0; i < this.begin; i++) if (this.input[i] === "\n") {
			row++;
			col = 1;
		} else col++;
		return [row, col];
	}
	size() {
		return this.end - this.begin;
	}
};
var Drop = class {
	liquidMethodMissing(key, context) {}
};
var toString$1 = Object.prototype.toString;
var toLowerCase = String.prototype.toLowerCase;
var hasOwnProperty = Object.hasOwnProperty;
function isString(value) {
	return typeof value === "string";
}
function isFunction(value) {
	return typeof value === "function";
}
function isPromise(val) {
	return val && isFunction(val.then);
}
function isIterator(val) {
	return val && isFunction(val.next) && isFunction(val.throw) && isFunction(val.return);
}
function escapeRegex(str) {
	return str.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
}
function promisify(fn) {
	return function(...args) {
		return new Promise((resolve$2, reject$1) => {
			fn(...args, (err, result) => {
				err ? reject$1(err) : resolve$2(result);
			});
		});
	};
}
function stringify(value) {
	value = toValue(value);
	if (isString(value)) return value;
	if (isNil(value)) return "";
	if (isArray(value)) return value.map((x) => stringify(x)).join("");
	return String(value);
}
function toEnumerable(val) {
	val = toValue(val);
	if (isArray(val)) return val;
	if (isString(val) && val.length > 0) return [val];
	if (isIterable(val)) return Array.from(val);
	if (isObject(val)) return Object.keys(val).map((key) => [key, val[key]]);
	return [];
}
function toArray(val) {
	val = toValue(val);
	if (isNil(val)) return [];
	if (isArray(val)) return val;
	return [val];
}
function toValue(value) {
	return value instanceof Drop && isFunction(value.valueOf) ? value.valueOf() : value;
}
function toNumber(value) {
	return +toValue(value) || 0;
}
function isNumber(value) {
	return typeof value === "number";
}
function toLiquid(value) {
	if (value && isFunction(value.toLiquid)) return toLiquid(value.toLiquid());
	return value;
}
function isNil(value) {
	return value == null;
}
function isUndefined(value) {
	return value === void 0;
}
function isArray(value) {
	return toString$1.call(value) === "[object Array]";
}
function isArrayLike(value) {
	return value && isNumber(value.length);
}
function isIterable(value) {
	return isObject(value) && Symbol.iterator in value;
}
function forOwn(obj, iteratee) {
	obj = obj || {};
	for (const k in obj) if (hasOwnProperty.call(obj, k)) {
		if (iteratee(obj[k], k, obj) === false) break;
	}
	return obj;
}
function last(arr) {
	return arr[arr.length - 1];
}
function isObject(value) {
	const type = typeof value;
	return value !== null && (type === "object" || type === "function");
}
function range(start, stop, step = 1) {
	const arr = [];
	for (let i = start; i < stop; i += step) arr.push(i);
	return arr;
}
function padStart(str, length, ch = " ") {
	return pad(str, length, ch, (str$1, ch$1) => ch$1 + str$1);
}
function padEnd(str, length, ch = " ") {
	return pad(str, length, ch, (str$1, ch$1) => str$1 + ch$1);
}
function pad(str, length, ch, add) {
	str = String(str);
	let n = length - str.length;
	while (n-- > 0) str = add(str, ch);
	return str;
}
function identify(val) {
	return val;
}
function changeCase(str) {
	return [...str].some((ch) => ch >= "a" && ch <= "z") ? str.toUpperCase() : str.toLowerCase();
}
function ellipsis(str, N) {
	return str.length > N ? str.slice(0, N - 3) + "..." : str;
}
function caseInsensitiveCompare(a, b) {
	if (a == null && b == null) return 0;
	if (a == null) return 1;
	if (b == null) return -1;
	a = toLowerCase.call(a);
	b = toLowerCase.call(b);
	if (a < b) return -1;
	if (a > b) return 1;
	return 0;
}
function argumentsToValue(fn) {
	return function(...args) {
		return fn.call(this, ...args.map(toValue));
	};
}
function argumentsToNumber(fn) {
	return function(...args) {
		return fn.call(this, ...args.map(toNumber));
	};
}
function escapeRegExp(text) {
	return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}
function* strictUniq(array) {
	const seen = /* @__PURE__ */ new Set();
	for (const element of array) {
		const key = JSON.stringify(element);
		if (!seen.has(key)) {
			seen.add(key);
			yield element;
		}
	}
}
var TRAIT = "__liquidClass__";
var LiquidError = class extends Error {
	constructor(err, token) {
		super(typeof err === "string" ? err : err.message);
		this.context = "";
		if (typeof err !== "string") Object.defineProperty(this, "originalError", {
			value: err,
			enumerable: false
		});
		Object.defineProperty(this, "token", {
			value: token,
			enumerable: false
		});
		Object.defineProperty(this, TRAIT, {
			value: "LiquidError",
			enumerable: false
		});
	}
	update() {
		Object.defineProperty(this, "context", {
			value: mkContext(this.token),
			enumerable: false
		});
		this.message = mkMessage(this.message, this.token);
		this.stack = this.message + "\n" + this.context + "\n" + this.stack;
		if (this.originalError) this.stack += "\nFrom " + this.originalError.stack;
	}
	static is(obj) {
		return (obj === null || obj === void 0 ? void 0 : obj[TRAIT]) === "LiquidError";
	}
};
var TokenizationError = class extends LiquidError {
	constructor(message, token) {
		super(message, token);
		this.name = "TokenizationError";
		super.update();
	}
};
var ParseError = class extends LiquidError {
	constructor(err, token) {
		super(err, token);
		this.name = "ParseError";
		this.message = err.message;
		super.update();
	}
};
var RenderError = class extends LiquidError {
	constructor(err, tpl) {
		super(err, tpl.token);
		this.name = "RenderError";
		this.message = err.message;
		super.update();
	}
	static is(obj) {
		return obj.name === "RenderError";
	}
};
var LiquidErrors = class extends LiquidError {
	constructor(errors) {
		super(errors[0], errors[0].token);
		this.errors = errors;
		this.name = "LiquidErrors";
		const s = errors.length > 1 ? "s" : "";
		this.message = `${errors.length} error${s} found`;
		super.update();
	}
	static is(obj) {
		return obj.name === "LiquidErrors";
	}
};
var UndefinedVariableError = class extends LiquidError {
	constructor(err, token) {
		super(err, token);
		this.name = "UndefinedVariableError";
		this.message = err.message;
		super.update();
	}
};
var InternalUndefinedVariableError = class extends Error {
	constructor(variableName) {
		super(`undefined variable: ${variableName}`);
		this.name = "InternalUndefinedVariableError";
		this.variableName = variableName;
	}
};
var AssertionError = class extends Error {
	constructor(message) {
		super(message);
		this.name = "AssertionError";
		this.message = message + "";
	}
};
function mkContext(token) {
	const [line, col] = token.getPosition();
	const lines = token.input.split("\n");
	const begin = Math.max(line - 2, 1);
	const end = Math.min(line + 3, lines.length);
	return range(begin, end + 1).map((lineNumber) => {
		let text = `${lineNumber === line ? ">> " : "   "}${padStart(String(lineNumber), String(end).length)}| `;
		const colIndicator = lineNumber === line ? "\n" + padStart("^", col + text.length) : "";
		text += lines[lineNumber - 1];
		text += colIndicator;
		return text;
	}).join("\n");
}
function mkMessage(msg, token) {
	if (token.file) msg += `, file:${token.file}`;
	const [line, col] = token.getPosition();
	msg += `, line:${line}, col:${col}`;
	return msg;
}
var TYPES = [
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	20,
	4,
	4,
	4,
	20,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	20,
	2,
	8,
	0,
	0,
	0,
	0,
	8,
	0,
	0,
	0,
	64,
	0,
	65,
	0,
	0,
	33,
	33,
	33,
	33,
	33,
	33,
	33,
	33,
	33,
	33,
	0,
	0,
	2,
	2,
	2,
	1,
	0,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	1,
	0,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	0
];
var WORD = 1;
var BLANK = 4;
var QUOTE = 8;
var INLINE_BLANK = 16;
var NUMBER = 32;
var SIGN = 64;
var PUNCTUATION = 128;
function isWord(char) {
	const code = char.charCodeAt(0);
	return code >= 128 ? !TYPES[code] : !!(TYPES[code] & WORD);
}
TYPES[160] = TYPES[5760] = TYPES[6158] = TYPES[8192] = TYPES[8193] = TYPES[8194] = TYPES[8195] = TYPES[8196] = TYPES[8197] = TYPES[8198] = TYPES[8199] = TYPES[8200] = TYPES[8201] = TYPES[8202] = TYPES[8232] = TYPES[8233] = TYPES[8239] = TYPES[8287] = TYPES[12288] = BLANK;
TYPES[8220] = TYPES[8221] = PUNCTUATION;
function assert(predicate, message) {
	if (!predicate) throw new AssertionError(typeof message === "function" ? message() : message || `expect ${predicate} to be true`);
}
function assertEmpty(predicate, message = `unexpected ${JSON.stringify(predicate)}`) {
	assert(!predicate, message);
}
var NullDrop = class extends Drop {
	equals(value) {
		return isNil(toValue(value));
	}
	gt() {
		return false;
	}
	geq() {
		return false;
	}
	lt() {
		return false;
	}
	leq() {
		return false;
	}
	valueOf() {
		return null;
	}
};
var EmptyDrop = class EmptyDrop extends Drop {
	equals(value) {
		if (value instanceof EmptyDrop) return false;
		value = toValue(value);
		if (isString(value) || isArray(value)) return value.length === 0;
		if (isObject(value)) return Object.keys(value).length === 0;
		return false;
	}
	gt() {
		return false;
	}
	geq() {
		return false;
	}
	lt() {
		return false;
	}
	leq() {
		return false;
	}
	valueOf() {
		return "";
	}
	static is(value) {
		return value instanceof EmptyDrop;
	}
};
var BlankDrop = class BlankDrop extends EmptyDrop {
	equals(value) {
		if (value === false) return true;
		if (isNil(toValue(value))) return true;
		if (isString(value)) return /^\s*$/.test(value);
		return super.equals(value);
	}
	static is(value) {
		return value instanceof BlankDrop;
	}
};
var ForloopDrop = class extends Drop {
	constructor(length, collection, variable) {
		super();
		this.i = 0;
		this.length = length;
		this.name = `${variable}-${collection}`;
	}
	next() {
		this.i++;
	}
	index0() {
		return this.i;
	}
	index() {
		return this.i + 1;
	}
	first() {
		return this.i === 0;
	}
	last() {
		return this.i === this.length - 1;
	}
	rindex() {
		return this.length - this.i;
	}
	rindex0() {
		return this.length - this.i - 1;
	}
	valueOf() {
		return JSON.stringify(this);
	}
};
var SimpleEmitter = class {
	constructor() {
		this.buffer = "";
	}
	write(html) {
		this.buffer += stringify(html);
	}
};
var StreamedEmitter = class {
	constructor() {
		this.buffer = "";
		this.stream = new PassThrough();
	}
	write(html) {
		this.stream.write(stringify(html));
	}
	error(err) {
		this.stream.emit("error", err);
	}
	end() {
		this.stream.end();
	}
};
var KeepingTypeEmitter = class {
	constructor() {
		this.buffer = "";
	}
	write(html) {
		html = toValue(html);
		if (typeof html !== "string" && this.buffer === "") this.buffer = html;
		else this.buffer = stringify(this.buffer) + stringify(html);
	}
};
var BlockDrop = class extends Drop {
	constructor(superBlockRender = () => "") {
		super();
		this.superBlockRender = superBlockRender;
	}
	*super() {
		const emitter = new SimpleEmitter();
		yield this.superBlockRender(emitter);
		return emitter.buffer;
	}
};
function isComparable(arg) {
	return arg && isFunction(arg.equals) && isFunction(arg.gt) && isFunction(arg.geq) && isFunction(arg.lt) && isFunction(arg.leq);
}
var nil = new NullDrop();
var literalValues = {
	"true": true,
	"false": false,
	"nil": nil,
	"null": nil,
	"empty": new EmptyDrop(),
	"blank": new BlankDrop()
};
function createTrie(input) {
	const trie = {};
	for (const [name, data] of Object.entries(input)) {
		let node = trie;
		for (let i = 0; i < name.length; i++) {
			const c = name[i];
			node[c] = node[c] || {};
			if (i === name.length - 1 && isWord(name[i])) node[c].needBoundary = true;
			node = node[c];
		}
		node.data = data;
		node.end = true;
	}
	return trie;
}
var __assign = function() {
	__assign = Object.assign || function __assign$1(t) {
		for (var s, i = 1, n = arguments.length; i < n; i++) {
			s = arguments[i];
			for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
		}
		return t;
	};
	return __assign.apply(this, arguments);
};
function __awaiter(thisArg, _arguments, P, generator) {
	function adopt(value) {
		return value instanceof P ? value : new P(function(resolve$2) {
			resolve$2(value);
		});
	}
	return new (P || (P = Promise))(function(resolve$2, reject$1) {
		function fulfilled(value) {
			try {
				step(generator.next(value));
			} catch (e) {
				reject$1(e);
			}
		}
		function rejected(value) {
			try {
				step(generator["throw"](value));
			} catch (e) {
				reject$1(e);
			}
		}
		function step(result) {
			result.done ? resolve$2(result.value) : adopt(result.value).then(fulfilled, rejected);
		}
		step((generator = generator.apply(thisArg, _arguments || [])).next());
	});
}
function toPromise(val) {
	return __awaiter(this, void 0, void 0, function* () {
		if (!isIterator(val)) return val;
		let value;
		let done = false;
		let next = "next";
		do {
			const state = val[next](value);
			done = state.done;
			value = state.value;
			next = "next";
			try {
				if (isIterator(value)) value = toPromise(value);
				if (isPromise(value)) value = yield value;
			} catch (err) {
				next = "throw";
				value = err;
			}
		} while (!done);
		return value;
	});
}
function toValueSync(val) {
	if (!isIterator(val)) return val;
	let value;
	let done = false;
	let next = "next";
	do {
		const state = val[next](value);
		done = state.done;
		value = state.value;
		next = "next";
		if (isIterator(value)) try {
			value = toValueSync(value);
		} catch (err) {
			next = "throw";
			value = err;
		}
	} while (!done);
	return value;
}
var rFormat = /%([-_0^#:]+)?(\d+)?([EO])?(.)/;
function daysInMonth(d) {
	return [
		31,
		isLeapYear(d) ? 29 : 28,
		31,
		30,
		31,
		30,
		31,
		31,
		30,
		31,
		30,
		31
	];
}
function getDayOfYear(d) {
	let num = 0;
	for (let i = 0; i < d.getMonth(); ++i) num += daysInMonth(d)[i];
	return num + d.getDate();
}
function getWeekOfYear(d, startDay) {
	const now = getDayOfYear(d) + (startDay - d.getDay());
	const then = 7 - new Date(d.getFullYear(), 0, 1).getDay() + startDay;
	return String(Math.floor((now - then) / 7) + 1);
}
function isLeapYear(d) {
	const year = d.getFullYear();
	return !!((year & 3) === 0 && (year % 100 || year % 400 === 0 && year));
}
function ordinal(d) {
	const date$1 = d.getDate();
	if ([
		11,
		12,
		13
	].includes(date$1)) return "th";
	switch (date$1 % 10) {
		case 1: return "st";
		case 2: return "nd";
		case 3: return "rd";
		default: return "th";
	}
}
function century(d) {
	return parseInt(d.getFullYear().toString().substring(0, 2), 10);
}
var padWidths = {
	d: 2,
	e: 2,
	H: 2,
	I: 2,
	j: 3,
	k: 2,
	l: 2,
	L: 3,
	m: 2,
	M: 2,
	S: 2,
	U: 2,
	W: 2
};
var padSpaceChars = /* @__PURE__ */ new Set("aAbBceklpP");
function getTimezoneOffset(d, opts) {
	const nOffset = Math.abs(d.getTimezoneOffset());
	const h = Math.floor(nOffset / 60);
	const m = nOffset % 60;
	return (d.getTimezoneOffset() > 0 ? "-" : "+") + padStart(h, 2, "0") + (opts.flags[":"] ? ":" : "") + padStart(m, 2, "0");
}
var formatCodes = {
	a: (d) => d.getShortWeekdayName(),
	A: (d) => d.getLongWeekdayName(),
	b: (d) => d.getShortMonthName(),
	B: (d) => d.getLongMonthName(),
	c: (d) => d.toLocaleString(),
	C: (d) => century(d),
	d: (d) => d.getDate(),
	e: (d) => d.getDate(),
	H: (d) => d.getHours(),
	I: (d) => String(d.getHours() % 12 || 12),
	j: (d) => getDayOfYear(d),
	k: (d) => d.getHours(),
	l: (d) => String(d.getHours() % 12 || 12),
	L: (d) => d.getMilliseconds(),
	m: (d) => d.getMonth() + 1,
	M: (d) => d.getMinutes(),
	N: (d, opts) => {
		const width = Number(opts.width) || 9;
		return padEnd(String(d.getMilliseconds()).slice(0, width), width, "0");
	},
	p: (d) => d.getHours() < 12 ? "AM" : "PM",
	P: (d) => d.getHours() < 12 ? "am" : "pm",
	q: (d) => ordinal(d),
	s: (d) => Math.round(d.getTime() / 1e3),
	S: (d) => d.getSeconds(),
	u: (d) => d.getDay() || 7,
	U: (d) => getWeekOfYear(d, 0),
	w: (d) => d.getDay(),
	W: (d) => getWeekOfYear(d, 1),
	x: (d) => d.toLocaleDateString(),
	X: (d) => d.toLocaleTimeString(),
	y: (d) => d.getFullYear().toString().slice(2, 4),
	Y: (d) => d.getFullYear(),
	z: getTimezoneOffset,
	Z: (d, opts) => d.getTimeZoneName() || getTimezoneOffset(d, opts),
	"t": () => "	",
	"n": () => "\n",
	"%": () => "%"
};
formatCodes.h = formatCodes.b;
function strftime(d, formatStr) {
	let output = "";
	let remaining = formatStr;
	let match;
	while (match = rFormat.exec(remaining)) {
		output += remaining.slice(0, match.index);
		remaining = remaining.slice(match.index + match[0].length);
		output += format(d, match);
	}
	return output + remaining;
}
function format(d, match) {
	const [input, flagStr = "", width, modifier, conversion] = match;
	const convert = formatCodes[conversion];
	if (!convert) return input;
	const flags = {};
	for (const flag of flagStr) flags[flag] = true;
	let ret = String(convert(d, {
		flags,
		width,
		modifier
	}));
	let padChar = padSpaceChars.has(conversion) ? " " : "0";
	let padWidth = width || padWidths[conversion] || 0;
	if (flags["^"]) ret = ret.toUpperCase();
	else if (flags["#"]) ret = changeCase(ret);
	if (flags["_"]) padChar = " ";
	else if (flags["0"]) padChar = "0";
	if (flags["-"]) padWidth = 0;
	return padStart(ret, padWidth, padChar);
}
function getDateTimeFormat() {
	return typeof Intl !== "undefined" ? Intl.DateTimeFormat : void 0;
}
var OneMinute = 6e4;
var TIMEZONE_PATTERN = /([zZ]|([+-])(\d{2}):?(\d{2}))$/;
var monthNames = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December"
];
var monthNamesShort = monthNames.map((name) => name.slice(0, 3));
var dayNames = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday"
];
var dayNamesShort = dayNames.map((name) => name.slice(0, 3));
var LiquidDate = class LiquidDate {
	constructor(init, locale, timezone) {
		this.locale = locale;
		this.DateTimeFormat = getDateTimeFormat();
		this.date = new Date(init);
		this.timezoneFixed = timezone !== void 0;
		if (timezone === void 0) timezone = this.date.getTimezoneOffset();
		this.timezoneOffset = isString(timezone) ? LiquidDate.getTimezoneOffset(timezone, this.date) : timezone;
		this.timezoneName = isString(timezone) ? timezone : "";
		const diff = (this.date.getTimezoneOffset() - this.timezoneOffset) * OneMinute;
		const time = this.date.getTime() + diff;
		this.displayDate = new Date(time);
	}
	getTime() {
		return this.displayDate.getTime();
	}
	getMilliseconds() {
		return this.displayDate.getMilliseconds();
	}
	getSeconds() {
		return this.displayDate.getSeconds();
	}
	getMinutes() {
		return this.displayDate.getMinutes();
	}
	getHours() {
		return this.displayDate.getHours();
	}
	getDay() {
		return this.displayDate.getDay();
	}
	getDate() {
		return this.displayDate.getDate();
	}
	getMonth() {
		return this.displayDate.getMonth();
	}
	getFullYear() {
		return this.displayDate.getFullYear();
	}
	toLocaleString(locale, init) {
		if (init === null || init === void 0 ? void 0 : init.timeZone) return this.date.toLocaleString(locale, init);
		return this.displayDate.toLocaleString(locale, init);
	}
	toLocaleTimeString(locale) {
		return this.displayDate.toLocaleTimeString(locale);
	}
	toLocaleDateString(locale) {
		return this.displayDate.toLocaleDateString(locale);
	}
	getTimezoneOffset() {
		return this.timezoneOffset;
	}
	getTimeZoneName() {
		if (this.timezoneFixed) return this.timezoneName;
		if (!this.DateTimeFormat) return;
		return this.DateTimeFormat().resolvedOptions().timeZone;
	}
	getLongMonthName() {
		var _a;
		return (_a = this.format({ month: "long" })) !== null && _a !== void 0 ? _a : monthNames[this.getMonth()];
	}
	getShortMonthName() {
		var _a;
		return (_a = this.format({ month: "short" })) !== null && _a !== void 0 ? _a : monthNamesShort[this.getMonth()];
	}
	getLongWeekdayName() {
		var _a;
		return (_a = this.format({ weekday: "long" })) !== null && _a !== void 0 ? _a : dayNames[this.displayDate.getDay()];
	}
	getShortWeekdayName() {
		var _a;
		return (_a = this.format({ weekday: "short" })) !== null && _a !== void 0 ? _a : dayNamesShort[this.displayDate.getDay()];
	}
	valid() {
		return !isNaN(this.getTime());
	}
	format(options) {
		return this.DateTimeFormat && this.DateTimeFormat(this.locale, options).format(this.displayDate);
	}
	static createDateFixedToTimezone(dateString, locale) {
		const m = dateString.match(TIMEZONE_PATTERN);
		if (m && m[1] === "Z") return new LiquidDate(+new Date(dateString), locale, 0);
		if (m && m[2] && m[3] && m[4]) {
			const [, , sign, hours, minutes] = m;
			const offset$1 = (sign === "+" ? -1 : 1) * (parseInt(hours, 10) * 60 + parseInt(minutes, 10));
			return new LiquidDate(+new Date(dateString), locale, offset$1);
		}
		return new LiquidDate(dateString, locale);
	}
	static getTimezoneOffset(timezoneName, date$1) {
		const localDateString = date$1.toLocaleString("en-US", { timeZone: timezoneName });
		const utcDateString = date$1.toLocaleString("en-US", { timeZone: "UTC" });
		const localDate = new Date(localDateString);
		return (+new Date(utcDateString) - +localDate) / (60 * 1e3);
	}
};
var Limiter = class {
	constructor(resource, limit$1) {
		this.base = 0;
		this.message = `${resource} limit exceeded`;
		this.limit = limit$1;
	}
	use(count) {
		count = +count || 0;
		assert(this.base + count <= this.limit, this.message);
		this.base += count;
	}
	check(count) {
		count = +count || 0;
		assert(count <= this.limit, this.message);
	}
};
var DelimitedToken = class extends Token {
	constructor(kind, [contentBegin, contentEnd], input, begin, end, trimLeft$1, trimRight$1, file) {
		super(kind, input, begin, end, file);
		this.trimLeft = false;
		this.trimRight = false;
		const tl = input[contentBegin] === "-";
		const tr = input[contentEnd - 1] === "-";
		let l = tl ? contentBegin + 1 : contentBegin;
		let r = tr ? contentEnd - 1 : contentEnd;
		while (l < r && TYPES[input.charCodeAt(l)] & BLANK) l++;
		while (r > l && TYPES[input.charCodeAt(r - 1)] & BLANK) r--;
		this.contentRange = [l, r];
		this.trimLeft = tl || trimLeft$1;
		this.trimRight = tr || trimRight$1;
	}
	get content() {
		return this.input.slice(this.contentRange[0], this.contentRange[1]);
	}
};
var TagToken = class extends DelimitedToken {
	constructor(input, begin, end, options, file) {
		const { trimTagLeft, trimTagRight, tagDelimiterLeft, tagDelimiterRight } = options;
		const [valueBegin, valueEnd] = [begin + tagDelimiterLeft.length, end - tagDelimiterRight.length];
		super(TokenKind.Tag, [valueBegin, valueEnd], input, begin, end, trimTagLeft, trimTagRight, file);
		this.tokenizer = new Tokenizer(input, options.operators, file, this.contentRange);
		this.name = this.tokenizer.readTagName();
		this.tokenizer.assert(this.name, `illegal tag syntax, tag name expected`);
		this.tokenizer.skipBlank();
		this.args = this.tokenizer.input.slice(this.tokenizer.p, this.contentRange[1]);
	}
};
var OutputToken = class extends DelimitedToken {
	constructor(input, begin, end, options, file) {
		const { trimOutputLeft, trimOutputRight, outputDelimiterLeft, outputDelimiterRight } = options;
		const valueRange = [begin + outputDelimiterLeft.length, end - outputDelimiterRight.length];
		super(TokenKind.Output, valueRange, input, begin, end, trimOutputLeft, trimOutputRight, file);
	}
};
var HTMLToken = class extends Token {
	constructor(input, begin, end, file) {
		super(TokenKind.HTML, input, begin, end, file);
		this.input = input;
		this.begin = begin;
		this.end = end;
		this.file = file;
		this.trimLeft = 0;
		this.trimRight = 0;
	}
	getContent() {
		return this.input.slice(this.begin + this.trimLeft, this.end - this.trimRight);
	}
};
var NumberToken = class extends Token {
	constructor(input, begin, end, file) {
		super(TokenKind.Number, input, begin, end, file);
		this.input = input;
		this.begin = begin;
		this.end = end;
		this.file = file;
		this.content = Number(this.getText());
	}
};
var IdentifierToken = class extends Token {
	constructor(input, begin, end, file) {
		super(TokenKind.Word, input, begin, end, file);
		this.input = input;
		this.begin = begin;
		this.end = end;
		this.file = file;
		this.content = this.getText();
	}
};
var LiteralToken = class extends Token {
	constructor(input, begin, end, file) {
		super(TokenKind.Literal, input, begin, end, file);
		this.input = input;
		this.begin = begin;
		this.end = end;
		this.file = file;
		this.literal = this.getText();
		this.content = literalValues[this.literal];
	}
};
var operatorPrecedences = {
	"==": 2,
	"!=": 2,
	">": 2,
	"<": 2,
	">=": 2,
	"<=": 2,
	"contains": 2,
	"not": 1,
	"and": 0,
	"or": 0
};
var operatorTypes = {
	"==": 0,
	"!=": 0,
	">": 0,
	"<": 0,
	">=": 0,
	"<=": 0,
	"contains": 0,
	"not": 1,
	"and": 0,
	"or": 0
};
var OperatorToken = class extends Token {
	constructor(input, begin, end, file) {
		super(TokenKind.Operator, input, begin, end, file);
		this.input = input;
		this.begin = begin;
		this.end = end;
		this.file = file;
		this.operator = this.getText();
	}
	getPrecedence() {
		const key = this.getText();
		return key in operatorPrecedences ? operatorPrecedences[key] : 1;
	}
};
var PropertyAccessToken = class extends Token {
	constructor(variable, props, input, begin, end, file) {
		super(TokenKind.PropertyAccess, input, begin, end, file);
		this.variable = variable;
		this.props = props;
	}
};
var FilterToken = class extends Token {
	constructor(name, args, input, begin, end, file) {
		super(TokenKind.Filter, input, begin, end, file);
		this.name = name;
		this.args = args;
	}
};
var HashToken = class extends Token {
	constructor(input, begin, end, name, value, file) {
		super(TokenKind.Hash, input, begin, end, file);
		this.input = input;
		this.begin = begin;
		this.end = end;
		this.name = name;
		this.value = value;
		this.file = file;
	}
};
var rHex = /[\da-fA-F]/;
var rOct = /[0-7]/;
var escapeChar = {
	b: "\b",
	f: "\f",
	n: "\n",
	r: "\r",
	t: "	",
	v: "\v"
};
function hexVal(c) {
	const code = c.charCodeAt(0);
	if (code >= 97) return code - 87;
	if (code >= 65) return code - 55;
	return code - 48;
}
function parseStringLiteral(str) {
	let ret = "";
	for (let i = 1; i < str.length - 1; i++) {
		if (str[i] !== "\\") {
			ret += str[i];
			continue;
		}
		if (escapeChar[str[i + 1]] !== void 0) ret += escapeChar[str[++i]];
		else if (str[i + 1] === "u") {
			let val = 0;
			let j = i + 2;
			while (j <= i + 5 && rHex.test(str[j])) val = val * 16 + hexVal(str[j++]);
			i = j - 1;
			ret += String.fromCharCode(val);
		} else if (!rOct.test(str[i + 1])) ret += str[++i];
		else {
			let j = i + 1;
			let val = 0;
			while (j <= i + 3 && rOct.test(str[j])) val = val * 8 + hexVal(str[j++]);
			i = j - 1;
			ret += String.fromCharCode(val);
		}
	}
	return ret;
}
var QuotedToken = class extends Token {
	constructor(input, begin, end, file) {
		super(TokenKind.Quoted, input, begin, end, file);
		this.input = input;
		this.begin = begin;
		this.end = end;
		this.file = file;
		this.content = parseStringLiteral(this.getText());
	}
};
var RangeToken = class extends Token {
	constructor(input, begin, end, lhs, rhs, file) {
		super(TokenKind.Range, input, begin, end, file);
		this.input = input;
		this.begin = begin;
		this.end = end;
		this.lhs = lhs;
		this.rhs = rhs;
		this.file = file;
	}
};
var LiquidTagToken = class extends DelimitedToken {
	constructor(input, begin, end, options, file) {
		super(TokenKind.Tag, [begin, end], input, begin, end, false, false, file);
		this.tokenizer = new Tokenizer(input, options.operators, file, this.contentRange);
		this.name = this.tokenizer.readTagName();
		this.tokenizer.assert(this.name, "illegal liquid tag syntax");
		this.tokenizer.skipBlank();
	}
	get args() {
		return this.tokenizer.input.slice(this.tokenizer.p, this.contentRange[1]);
	}
};
var FilteredValueToken = class extends Token {
	constructor(initial, filters$1, input, begin, end, file) {
		super(TokenKind.FilteredValue, input, begin, end, file);
		this.initial = initial;
		this.filters = filters$1;
		this.input = input;
		this.begin = begin;
		this.end = end;
		this.file = file;
	}
};
var polyfill = { now: () => Date.now() };
function getPerformance() {
	return typeof global === "object" && global.performance || typeof window === "object" && window.performance || polyfill;
}
var Render = class {
	renderTemplatesToNodeStream(templates, ctx) {
		const emitter = new StreamedEmitter();
		Promise.resolve().then(() => toPromise(this.renderTemplates(templates, ctx, emitter))).then(() => emitter.end(), (err) => emitter.error(err));
		return emitter.stream;
	}
	*renderTemplates(templates, ctx, emitter) {
		if (!emitter) emitter = ctx.opts.keepOutputType ? new KeepingTypeEmitter() : new SimpleEmitter();
		const errors = [];
		for (const tpl of templates) {
			ctx.renderLimit.check(getPerformance().now());
			try {
				const html = yield tpl.render(ctx, emitter);
				html && emitter.write(html);
				if (ctx.breakCalled || ctx.continueCalled) break;
			} catch (e) {
				const err = LiquidError.is(e) ? e : new RenderError(e, tpl);
				if (ctx.opts.catchAllErrors) errors.push(err);
				else throw err;
			}
		}
		if (errors.length) throw new LiquidErrors(errors);
		return emitter.buffer;
	}
};
var Expression = class {
	constructor(tokens) {
		this.postfix = [...toPostfix(tokens)];
	}
	*evaluate(ctx, lenient) {
		assert(ctx, "unable to evaluate: context not defined");
		const operands = [];
		for (const token of this.postfix) if (isOperatorToken(token)) {
			const r = operands.pop();
			let result;
			if (operatorTypes[token.operator] === 1) result = yield ctx.opts.operators[token.operator](r, ctx);
			else {
				const l = operands.pop();
				result = yield ctx.opts.operators[token.operator](l, r, ctx);
			}
			operands.push(result);
		} else operands.push(yield evalToken(token, ctx, lenient));
		return operands[0];
	}
	valid() {
		return !!this.postfix.length;
	}
};
function* evalToken(token, ctx, lenient = false) {
	if (!token) return;
	if ("content" in token) return token.content;
	if (isPropertyAccessToken(token)) return yield evalPropertyAccessToken(token, ctx, lenient);
	if (isRangeToken(token)) return yield evalRangeToken(token, ctx);
}
function* evalPropertyAccessToken(token, ctx, lenient) {
	const props = [];
	for (const prop of token.props) props.push(yield evalToken(prop, ctx, false));
	try {
		if (token.variable) {
			const variable = yield evalToken(token.variable, ctx, lenient);
			return yield ctx._getFromScope(variable, props);
		} else return yield ctx._get(props);
	} catch (e) {
		if (lenient && e.name === "InternalUndefinedVariableError") return null;
		throw new UndefinedVariableError(e, token);
	}
}
function evalQuotedToken(token) {
	return token.content;
}
function* evalRangeToken(token, ctx) {
	const low = yield evalToken(token.lhs, ctx);
	const high = yield evalToken(token.rhs, ctx);
	ctx.memoryLimit.use(high - low + 1);
	return range(+low, +high + 1);
}
function* toPostfix(tokens) {
	const ops = [];
	for (const token of tokens) if (isOperatorToken(token)) {
		while (ops.length && ops[ops.length - 1].getPrecedence() > token.getPrecedence()) yield ops.pop();
		ops.push(token);
	} else yield token;
	while (ops.length) yield ops.pop();
}
function isTruthy(val, ctx) {
	return !isFalsy(val, ctx);
}
function isFalsy(val, ctx) {
	val = toValue(val);
	if (ctx.opts.jsTruthy) return !val;
	else return val === false || void 0 === val || val === null;
}
var defaultOperators = {
	"==": equals,
	"!=": (l, r) => !equals(l, r),
	">": (l, r) => {
		if (isComparable(l)) return l.gt(r);
		if (isComparable(r)) return r.lt(l);
		return toValue(l) > toValue(r);
	},
	"<": (l, r) => {
		if (isComparable(l)) return l.lt(r);
		if (isComparable(r)) return r.gt(l);
		return toValue(l) < toValue(r);
	},
	">=": (l, r) => {
		if (isComparable(l)) return l.geq(r);
		if (isComparable(r)) return r.leq(l);
		return toValue(l) >= toValue(r);
	},
	"<=": (l, r) => {
		if (isComparable(l)) return l.leq(r);
		if (isComparable(r)) return r.geq(l);
		return toValue(l) <= toValue(r);
	},
	"contains": (l, r) => {
		l = toValue(l);
		if (isArray(l)) return l.some((i) => equals(i, r));
		if (isFunction(l === null || l === void 0 ? void 0 : l.indexOf)) return l.indexOf(toValue(r)) > -1;
		return false;
	},
	"not": (v, ctx) => isFalsy(toValue(v), ctx),
	"and": (l, r, ctx) => isTruthy(toValue(l), ctx) && isTruthy(toValue(r), ctx),
	"or": (l, r, ctx) => isTruthy(toValue(l), ctx) || isTruthy(toValue(r), ctx)
};
function equals(lhs, rhs) {
	if (isComparable(lhs)) return lhs.equals(rhs);
	if (isComparable(rhs)) return rhs.equals(lhs);
	lhs = toValue(lhs);
	rhs = toValue(rhs);
	if (isArray(lhs)) return isArray(rhs) && arrayEquals(lhs, rhs);
	return lhs === rhs;
}
function arrayEquals(lhs, rhs) {
	if (lhs.length !== rhs.length) return false;
	return !lhs.some((value, i) => !equals(value, rhs[i]));
}
function arrayIncludes(arr, item) {
	return arr.some((value) => equals(value, item));
}
var Node = class {
	constructor(key, value, next, prev) {
		this.key = key;
		this.value = value;
		this.next = next;
		this.prev = prev;
	}
};
var LRU = class {
	constructor(limit$1, size$1 = 0) {
		this.limit = limit$1;
		this.size = size$1;
		this.cache = {};
		this.head = new Node("HEAD", null, null, null);
		this.tail = new Node("TAIL", null, null, null);
		this.head.next = this.tail;
		this.tail.prev = this.head;
	}
	write(key, value) {
		if (this.cache[key]) this.cache[key].value = value;
		else {
			const node = new Node(key, value, this.head.next, this.head);
			this.head.next.prev = node;
			this.head.next = node;
			this.cache[key] = node;
			this.size++;
			this.ensureLimit();
		}
	}
	read(key) {
		if (!this.cache[key]) return;
		const { value } = this.cache[key];
		this.remove(key);
		this.write(key, value);
		return value;
	}
	remove(key) {
		const node = this.cache[key];
		node.prev.next = node.next;
		node.next.prev = node.prev;
		delete this.cache[key];
		this.size--;
	}
	clear() {
		this.head.next = this.tail;
		this.tail.prev = this.head;
		this.size = 0;
		this.cache = {};
	}
	ensureLimit() {
		if (this.size > this.limit) this.remove(this.tail.prev.key);
	}
};
function requireResolve(file) {
	return createRequire(process.cwd() + "/").resolve(file);
}
var statAsync = promisify(stat);
var readFileAsync = promisify(readFile);
function exists(filepath) {
	return __awaiter(this, void 0, void 0, function* () {
		try {
			yield statAsync(filepath);
			return true;
		} catch (err) {
			return false;
		}
	});
}
function readFile$1(filepath) {
	return readFileAsync(filepath, "utf8");
}
function existsSync(filepath) {
	try {
		statSync(filepath);
		return true;
	} catch (err) {
		return false;
	}
}
function readFileSync$1(filepath) {
	return readFileSync(filepath, "utf8");
}
function resolve$1(root, file, ext) {
	if (!extname(file)) file += ext;
	return resolve(root, file);
}
function fallback(file) {
	try {
		return requireResolve(file);
	} catch (e) {}
}
function dirname$1(filepath) {
	return dirname(filepath);
}
function contains(root, file) {
	root = resolve(root);
	root = root.endsWith(sep) ? root : root + sep;
	return file.startsWith(root);
}
var fs = /* @__PURE__ */ Object.freeze({
	__proto__: null,
	exists,
	readFile: readFile$1,
	existsSync,
	readFileSync: readFileSync$1,
	resolve: resolve$1,
	fallback,
	dirname: dirname$1,
	contains,
	sep
});
function defaultFilter(value, defaultValue, ...args) {
	value = toValue(value);
	if (isArray(value) || isString(value)) return value.length ? value : defaultValue;
	if (value === false && new Map(args).get("allow_false")) return false;
	return isFalsy(value, this.context) ? defaultValue : value;
}
function json(value, space = 0) {
	return JSON.stringify(value, null, space);
}
function inspect(value, space = 0) {
	const ancestors = [];
	return JSON.stringify(value, function(_key, value$1) {
		if (typeof value$1 !== "object" || value$1 === null) return value$1;
		while (ancestors.length > 0 && ancestors[ancestors.length - 1] !== this) ancestors.pop();
		if (ancestors.includes(value$1)) return "[Circular]";
		ancestors.push(value$1);
		return value$1;
	}, space);
}
function to_integer(value) {
	return Number(value);
}
var misc = {
	default: defaultFilter,
	raw: {
		raw: true,
		handler: identify
	},
	jsonify: json,
	to_integer,
	json,
	inspect
};
var escapeMap = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&#34;",
	"'": "&#39;"
};
var unescapeMap = {
	"&amp;": "&",
	"&lt;": "<",
	"&gt;": ">",
	"&#34;": "\"",
	"&#39;": "'"
};
function escape(str) {
	str = stringify(str);
	this.context.memoryLimit.use(str.length);
	return str.replace(/&|<|>|"|'/g, (m) => escapeMap[m]);
}
function xml_escape(str) {
	return escape.call(this, str);
}
function unescape(str) {
	str = stringify(str);
	this.context.memoryLimit.use(str.length);
	return str.replace(/&(amp|lt|gt|#34|#39);/g, (m) => unescapeMap[m]);
}
function escape_once(str) {
	return escape.call(this, unescape.call(this, str));
}
function newline_to_br(v) {
	const str = stringify(v);
	this.context.memoryLimit.use(str.length);
	return str.replace(/\r?\n/gm, "<br />\n");
}
function strip_html(v) {
	const str = stringify(v);
	this.context.memoryLimit.use(str.length);
	return str.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<.*?>|<!--[\s\S]*?-->/g, "");
}
var htmlFilters = /* @__PURE__ */ Object.freeze({
	__proto__: null,
	escape,
	xml_escape,
	escape_once,
	newline_to_br,
	strip_html
});
var MapFS = class {
	constructor(mapping) {
		this.mapping = mapping;
		this.sep = "/";
	}
	exists(filepath) {
		return __awaiter(this, void 0, void 0, function* () {
			return this.existsSync(filepath);
		});
	}
	existsSync(filepath) {
		return !isNil(this.mapping[filepath]);
	}
	readFile(filepath) {
		return __awaiter(this, void 0, void 0, function* () {
			return this.readFileSync(filepath);
		});
	}
	readFileSync(filepath) {
		const content = this.mapping[filepath];
		if (isNil(content)) throw new Error(`ENOENT: ${filepath}`);
		return content;
	}
	dirname(filepath) {
		const segments = filepath.split(this.sep);
		segments.pop();
		return segments.join(this.sep);
	}
	resolve(dir, file, ext) {
		file += ext;
		if (dir === ".") return file;
		const segments = dir.split(/\/+/);
		for (const segment of file.split(this.sep)) if (segment === "." || segment === "") continue;
		else if (segment === "..") {
			if (segments.length > 1 || segments[0] !== "") segments.pop();
		} else segments.push(segment);
		return segments.join(this.sep);
	}
};
var defaultOptions = {
	root: ["."],
	layouts: ["."],
	partials: ["."],
	relativeReference: true,
	jekyllInclude: false,
	keyValueSeparator: ":",
	cache: void 0,
	extname: "",
	fs,
	dynamicPartials: true,
	jsTruthy: false,
	dateFormat: "%A, %B %-e, %Y at %-l:%M %P %z",
	locale: "",
	trimTagRight: false,
	trimTagLeft: false,
	trimOutputRight: false,
	trimOutputLeft: false,
	greedy: true,
	tagDelimiterLeft: "{%",
	tagDelimiterRight: "%}",
	outputDelimiterLeft: "{{",
	outputDelimiterRight: "}}",
	preserveTimezones: false,
	strictFilters: false,
	strictVariables: false,
	ownPropertyOnly: true,
	lenientIf: false,
	globals: {},
	keepOutputType: false,
	operators: defaultOperators,
	memoryLimit: Infinity,
	parseLimit: Infinity,
	renderLimit: Infinity
};
function normalize(options) {
	var _a, _b;
	if (options.hasOwnProperty("root")) {
		if (!options.hasOwnProperty("partials")) options.partials = options.root;
		if (!options.hasOwnProperty("layouts")) options.layouts = options.root;
	}
	if (options.hasOwnProperty("cache")) {
		let cache;
		if (typeof options.cache === "number") cache = options.cache > 0 ? new LRU(options.cache) : void 0;
		else if (typeof options.cache === "object") cache = options.cache;
		else cache = options.cache ? new LRU(1024) : void 0;
		options.cache = cache;
	}
	options = Object.assign(Object.assign(Object.assign({}, defaultOptions), options.jekyllInclude ? { dynamicPartials: false } : {}), options);
	if ((!options.fs.dirname || !options.fs.sep) && options.relativeReference) {
		console.warn("[LiquidJS] `fs.dirname` and `fs.sep` are required for relativeReference, set relativeReference to `false` to suppress this warning");
		options.relativeReference = false;
	}
	options.root = normalizeDirectoryList(options.root);
	options.partials = normalizeDirectoryList(options.partials);
	options.layouts = normalizeDirectoryList(options.layouts);
	options.outputEscape = options.outputEscape && getOutputEscapeFunction(options.outputEscape);
	if (!options.locale) options.locale = (_b = (_a = getDateTimeFormat()) === null || _a === void 0 ? void 0 : _a().resolvedOptions().locale) !== null && _b !== void 0 ? _b : "en-US";
	if (options.templates) {
		options.fs = new MapFS(options.templates);
		options.relativeReference = true;
		options.root = options.partials = options.layouts = ".";
	}
	return options;
}
function getOutputEscapeFunction(nameOrFunction) {
	if (nameOrFunction === "escape") return escape;
	if (nameOrFunction === "json") return misc.json;
	assert(isFunction(nameOrFunction), "`outputEscape` need to be of type string or function");
	return nameOrFunction;
}
function normalizeDirectoryList(value) {
	let list = [];
	if (isArray(value)) list = value;
	if (isString(value)) list = [value];
	return list;
}
function whiteSpaceCtrl(tokens, options) {
	let inRaw = false;
	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];
		if (!isDelimitedToken(token)) continue;
		if (!inRaw && token.trimLeft) trimLeft(tokens[i - 1], options.greedy);
		if (isTagToken(token)) {
			if (token.name === "raw") inRaw = true;
			else if (token.name === "endraw") inRaw = false;
		}
		if (!inRaw && token.trimRight) trimRight(tokens[i + 1], options.greedy);
	}
}
function trimLeft(token, greedy) {
	if (!token || !isHTMLToken(token)) return;
	const mask = greedy ? BLANK : INLINE_BLANK;
	while (TYPES[token.input.charCodeAt(token.end - 1 - token.trimRight)] & mask) token.trimRight++;
}
function trimRight(token, greedy) {
	if (!token || !isHTMLToken(token)) return;
	const mask = greedy ? BLANK : INLINE_BLANK;
	while (TYPES[token.input.charCodeAt(token.begin + token.trimLeft)] & mask) token.trimLeft++;
	if (token.input.charAt(token.begin + token.trimLeft) === "\n") token.trimLeft++;
}
var Tokenizer = class {
	constructor(input, operators = defaultOptions.operators, file, range$1) {
		this.input = input;
		this.file = file;
		this.rawBeginAt = -1;
		this.p = range$1 ? range$1[0] : 0;
		this.N = range$1 ? range$1[1] : input.length;
		this.opTrie = createTrie(operators);
		this.literalTrie = createTrie(literalValues);
	}
	readExpression() {
		return new Expression(this.readExpressionTokens());
	}
	*readExpressionTokens() {
		while (this.p < this.N) {
			const operator = this.readOperator();
			if (operator) {
				yield operator;
				continue;
			}
			const operand = this.readValue();
			if (operand) {
				yield operand;
				continue;
			}
			return;
		}
	}
	readOperator() {
		this.skipBlank();
		const end = this.matchTrie(this.opTrie);
		if (end === -1) return;
		return new OperatorToken(this.input, this.p, this.p = end, this.file);
	}
	matchTrie(trie) {
		let node = trie;
		let i = this.p;
		let info;
		while (node[this.input[i]] && i < this.N) {
			node = node[this.input[i++]];
			if (node["end"]) info = node;
		}
		if (!info) return -1;
		if (info["needBoundary"] && isWord(this.peek(i - this.p))) return -1;
		return i;
	}
	readFilteredValue() {
		const begin = this.p;
		const initial = this.readExpression();
		this.assert(initial.valid(), `invalid value expression: ${this.snapshot()}`);
		return new FilteredValueToken(initial, this.readFilters(), this.input, begin, this.p, this.file);
	}
	readFilters() {
		const filters$1 = [];
		while (true) {
			const filter$1 = this.readFilter();
			if (!filter$1) return filters$1;
			filters$1.push(filter$1);
		}
	}
	readFilter() {
		this.skipBlank();
		if (this.end()) return null;
		this.assert(this.read() === "|", `expected "|" before filter`);
		const name = this.readIdentifier();
		if (!name.size()) {
			this.assert(this.end(), `expected filter name`);
			return null;
		}
		const args = [];
		this.skipBlank();
		if (this.peek() === ":") do {
			++this.p;
			const arg = this.readFilterArg();
			arg && args.push(arg);
			this.skipBlank();
			this.assert(this.end() || this.peek() === "," || this.peek() === "|", () => `unexpected character ${this.snapshot()}`);
		} while (this.peek() === ",");
		else if (this.peek() === "|" || this.end());
		else throw this.error("expected \":\" after filter name");
		return new FilterToken(name.getText(), args, this.input, name.begin, this.p, this.file);
	}
	readFilterArg() {
		const key = this.readValue();
		if (!key) return;
		this.skipBlank();
		if (this.peek() !== ":") return key;
		++this.p;
		const value = this.readValue();
		return [key.getText(), value];
	}
	readTopLevelTokens(options = defaultOptions) {
		const tokens = [];
		while (this.p < this.N) {
			const token = this.readTopLevelToken(options);
			tokens.push(token);
		}
		whiteSpaceCtrl(tokens, options);
		return tokens;
	}
	readTopLevelToken(options) {
		const { tagDelimiterLeft, outputDelimiterLeft } = options;
		if (this.rawBeginAt > -1) return this.readEndrawOrRawContent(options);
		if (this.match(tagDelimiterLeft)) return this.readTagToken(options);
		if (this.match(outputDelimiterLeft)) return this.readOutputToken(options);
		return this.readHTMLToken([tagDelimiterLeft, outputDelimiterLeft]);
	}
	readHTMLToken(stopStrings) {
		const begin = this.p;
		while (this.p < this.N) {
			if (stopStrings.some((str) => this.match(str))) break;
			++this.p;
		}
		return new HTMLToken(this.input, begin, this.p, this.file);
	}
	readTagToken(options) {
		const { file, input } = this;
		const begin = this.p;
		if (this.readToDelimiter(options.tagDelimiterRight) === -1) throw this.error(`tag ${this.snapshot(begin)} not closed`, begin);
		const token = new TagToken(input, begin, this.p, options, file);
		if (token.name === "raw") this.rawBeginAt = begin;
		return token;
	}
	readToDelimiter(delimiter, respectQuoted = false) {
		this.skipBlank();
		while (this.p < this.N) {
			if (respectQuoted && this.peekType() & QUOTE) {
				this.readQuoted();
				continue;
			}
			++this.p;
			if (this.rmatch(delimiter)) return this.p;
		}
		return -1;
	}
	readOutputToken(options = defaultOptions) {
		const { file, input } = this;
		const { outputDelimiterRight } = options;
		const begin = this.p;
		if (this.readToDelimiter(outputDelimiterRight, true) === -1) throw this.error(`output ${this.snapshot(begin)} not closed`, begin);
		return new OutputToken(input, begin, this.p, options, file);
	}
	readEndrawOrRawContent(options) {
		const { tagDelimiterLeft, tagDelimiterRight } = options;
		const begin = this.p;
		let leftPos = this.readTo(tagDelimiterLeft) - tagDelimiterLeft.length;
		while (this.p < this.N) {
			if (this.readIdentifier().getText() !== "endraw") {
				leftPos = this.readTo(tagDelimiterLeft) - tagDelimiterLeft.length;
				continue;
			}
			while (this.p <= this.N) {
				if (this.rmatch(tagDelimiterRight)) {
					const end = this.p;
					if (begin === leftPos) {
						this.rawBeginAt = -1;
						return new TagToken(this.input, begin, end, options, this.file);
					} else {
						this.p = leftPos;
						return new HTMLToken(this.input, begin, leftPos, this.file);
					}
				}
				if (this.rmatch(tagDelimiterLeft)) break;
				this.p++;
			}
		}
		throw this.error(`raw ${this.snapshot(this.rawBeginAt)} not closed`, begin);
	}
	readLiquidTagTokens(options = defaultOptions) {
		const tokens = [];
		while (this.p < this.N) {
			const token = this.readLiquidTagToken(options);
			token && tokens.push(token);
		}
		return tokens;
	}
	readLiquidTagToken(options) {
		this.skipBlank();
		if (this.end()) return;
		const begin = this.p;
		this.readToDelimiter("\n");
		const end = this.p;
		return new LiquidTagToken(this.input, begin, end, options, this.file);
	}
	error(msg, pos = this.p) {
		return new TokenizationError(msg, new IdentifierToken(this.input, pos, this.N, this.file));
	}
	assert(pred, msg, pos) {
		if (!pred) throw this.error(typeof msg === "function" ? msg() : msg, pos);
	}
	snapshot(begin = this.p) {
		return JSON.stringify(ellipsis(this.input.slice(begin, this.N), 32));
	}
	readWord() {
		return this.readIdentifier();
	}
	readIdentifier() {
		this.skipBlank();
		const begin = this.p;
		while (!this.end() && isWord(this.peek())) ++this.p;
		return new IdentifierToken(this.input, begin, this.p, this.file);
	}
	readNonEmptyIdentifier() {
		const id$1 = this.readIdentifier();
		return id$1.size() ? id$1 : void 0;
	}
	readTagName() {
		this.skipBlank();
		if (this.input[this.p] === "#") return this.input.slice(this.p, ++this.p);
		return this.readIdentifier().getText();
	}
	readHashes(jekyllStyle) {
		const hashes = [];
		while (true) {
			const hash = this.readHash(jekyllStyle);
			if (!hash) return hashes;
			hashes.push(hash);
		}
	}
	readHash(jekyllStyle) {
		this.skipBlank();
		if (this.peek() === ",") ++this.p;
		const begin = this.p;
		const name = this.readNonEmptyIdentifier();
		if (!name) return;
		let value;
		this.skipBlank();
		const sep$1 = isString(jekyllStyle) ? jekyllStyle : jekyllStyle ? "=" : ":";
		if (this.peek() === sep$1) {
			++this.p;
			value = this.readValue();
		}
		return new HashToken(this.input, begin, this.p, name, value, this.file);
	}
	remaining() {
		return this.input.slice(this.p, this.N);
	}
	advance(step = 1) {
		this.p += step;
	}
	end() {
		return this.p >= this.N;
	}
	read() {
		return this.input[this.p++];
	}
	readTo(end) {
		while (this.p < this.N) {
			++this.p;
			if (this.rmatch(end)) return this.p;
		}
		return -1;
	}
	readValue() {
		this.skipBlank();
		const begin = this.p;
		const variable = this.readLiteral() || this.readQuoted() || this.readRange() || this.readNumber();
		const props = this.readProperties(!variable);
		if (!props.length) return variable;
		return new PropertyAccessToken(variable, props, this.input, begin, this.p);
	}
	readScopeValue() {
		this.skipBlank();
		const begin = this.p;
		const props = this.readProperties();
		if (!props.length) return void 0;
		return new PropertyAccessToken(void 0, props, this.input, begin, this.p);
	}
	readProperties(isBegin = true) {
		const props = [];
		while (true) {
			if (this.peek() === "[") {
				this.p++;
				const prop = this.readValue() || new IdentifierToken(this.input, this.p, this.p, this.file);
				this.assert(this.readTo("]") !== -1, "[ not closed");
				props.push(prop);
				continue;
			}
			if (isBegin && !props.length) {
				const prop = this.readNonEmptyIdentifier();
				if (prop) {
					props.push(prop);
					continue;
				}
			}
			if (this.peek() === "." && this.peek(1) !== ".") {
				this.p++;
				const prop = this.readNonEmptyIdentifier();
				if (!prop) break;
				props.push(prop);
				continue;
			}
			break;
		}
		return props;
	}
	readNumber() {
		this.skipBlank();
		let decimalFound = false;
		let digitFound = false;
		let n = 0;
		if (this.peekType() & SIGN) n++;
		while (this.p + n <= this.N) if (this.peekType(n) & NUMBER) {
			digitFound = true;
			n++;
		} else if (this.peek(n) === "." && this.peek(n + 1) !== ".") {
			if (decimalFound || !digitFound) return;
			decimalFound = true;
			n++;
		} else break;
		if (digitFound && !isWord(this.peek(n))) {
			const num = new NumberToken(this.input, this.p, this.p + n, this.file);
			this.advance(n);
			return num;
		}
	}
	readLiteral() {
		this.skipBlank();
		const end = this.matchTrie(this.literalTrie);
		if (end === -1) return;
		const literal = new LiteralToken(this.input, this.p, end, this.file);
		this.p = end;
		return literal;
	}
	readRange() {
		this.skipBlank();
		const begin = this.p;
		if (this.peek() !== "(") return;
		++this.p;
		const lhs = this.readValueOrThrow();
		this.skipBlank();
		this.assert(this.read() === "." && this.read() === ".", "invalid range syntax");
		const rhs = this.readValueOrThrow();
		this.skipBlank();
		this.assert(this.read() === ")", "invalid range syntax");
		return new RangeToken(this.input, begin, this.p, lhs, rhs, this.file);
	}
	readValueOrThrow() {
		const value = this.readValue();
		this.assert(value, () => `unexpected token ${this.snapshot()}, value expected`);
		return value;
	}
	readQuoted() {
		this.skipBlank();
		const begin = this.p;
		if (!(this.peekType() & QUOTE)) return;
		++this.p;
		let escaped = false;
		while (this.p < this.N) {
			++this.p;
			if (this.input[this.p - 1] === this.input[begin] && !escaped) break;
			if (escaped) escaped = false;
			else if (this.input[this.p - 1] === "\\") escaped = true;
		}
		return new QuotedToken(this.input, begin, this.p, this.file);
	}
	*readFileNameTemplate(options) {
		const { outputDelimiterLeft } = options;
		const htmlStopStrings = [
			",",
			" ",
			outputDelimiterLeft
		];
		const htmlStopStringSet = new Set(htmlStopStrings);
		while (this.p < this.N && !htmlStopStringSet.has(this.peek())) yield this.match(outputDelimiterLeft) ? this.readOutputToken(options) : this.readHTMLToken(htmlStopStrings);
	}
	match(word) {
		for (let i = 0; i < word.length; i++) if (word[i] !== this.input[this.p + i]) return false;
		return true;
	}
	rmatch(pattern) {
		for (let i = 0; i < pattern.length; i++) if (pattern[pattern.length - 1 - i] !== this.input[this.p - 1 - i]) return false;
		return true;
	}
	peekType(n = 0) {
		return this.p + n >= this.N ? 0 : TYPES[this.input.charCodeAt(this.p + n)];
	}
	peek(n = 0) {
		return this.p + n >= this.N ? "" : this.input[this.p + n];
	}
	skipBlank() {
		while (this.peekType() & BLANK) ++this.p;
	}
};
var ParseStream = class {
	constructor(tokens, parseToken) {
		this.handlers = {};
		this.stopRequested = false;
		this.tokens = tokens;
		this.parseToken = parseToken;
	}
	on(name, cb) {
		this.handlers[name] = cb;
		return this;
	}
	trigger(event, arg) {
		const h = this.handlers[event];
		return h ? (h.call(this, arg), true) : false;
	}
	start() {
		this.trigger("start");
		let token;
		while (!this.stopRequested && (token = this.tokens.shift())) {
			if (this.trigger("token", token)) continue;
			if (isTagToken(token) && this.trigger(`tag:${token.name}`, token)) continue;
			const template$1 = this.parseToken(token, this.tokens);
			this.trigger("template", template$1);
		}
		if (!this.stopRequested) this.trigger("end");
		return this;
	}
	stop() {
		this.stopRequested = true;
		return this;
	}
};
var TemplateImpl = class {
	constructor(token) {
		this.token = token;
	}
};
var Tag = class extends TemplateImpl {
	constructor(token, remainTokens, liquid) {
		super(token);
		this.name = token.name;
		this.liquid = liquid;
		this.tokenizer = token.tokenizer;
	}
};
var Hash = class {
	constructor(input, jekyllStyle) {
		this.hash = {};
		const tokenizer = input instanceof Tokenizer ? input : new Tokenizer(input, {});
		for (const hash of tokenizer.readHashes(jekyllStyle)) this.hash[hash.name.content] = hash.value;
	}
	*render(ctx) {
		const hash = {};
		for (const key of Object.keys(this.hash)) hash[key] = this.hash[key] === void 0 ? true : yield evalToken(this.hash[key], ctx);
		return hash;
	}
};
function createTagClass(options) {
	return class extends Tag {
		constructor(token, tokens, liquid) {
			super(token, tokens, liquid);
			if (isFunction(options.parse)) options.parse.call(this, token, tokens);
		}
		*render(ctx, emitter) {
			const hash = yield new Hash(this.token.args, ctx.opts.keyValueSeparator).render(ctx);
			return yield options.render.call(this, ctx, emitter, hash);
		}
	};
}
function isKeyValuePair(arr) {
	return isArray(arr);
}
var Filter = class {
	constructor(token, options, liquid) {
		this.token = token;
		this.name = token.name;
		this.handler = isFunction(options) ? options : isFunction(options === null || options === void 0 ? void 0 : options.handler) ? options.handler : identify;
		this.raw = !isFunction(options) && !!(options === null || options === void 0 ? void 0 : options.raw);
		this.args = token.args;
		this.liquid = liquid;
	}
	*render(value, context) {
		const argv = [];
		for (const arg of this.args) if (isKeyValuePair(arg)) argv.push([arg[0], yield evalToken(arg[1], context)]);
		else argv.push(yield evalToken(arg, context));
		return yield this.handler.apply({
			context,
			token: this.token,
			liquid: this.liquid
		}, [value, ...argv]);
	}
};
var Value = class {
	constructor(input, liquid) {
		this.filters = [];
		const token = typeof input === "string" ? new Tokenizer(input, liquid.options.operators).readFilteredValue() : input;
		this.initial = token.initial;
		this.filters = token.filters.map((token$1) => new Filter(token$1, this.getFilter(liquid, token$1.name), liquid));
	}
	*value(ctx, lenient) {
		lenient = lenient || ctx.opts.lenientIf && this.filters.length > 0 && this.filters[0].name === "default";
		let val = yield this.initial.evaluate(ctx, lenient);
		for (const filter$1 of this.filters) val = yield filter$1.render(val, ctx);
		return val;
	}
	getFilter(liquid, name) {
		const impl = liquid.filters[name];
		assert(impl || !liquid.options.strictFilters, () => `undefined filter: ${name}`);
		return impl;
	}
};
var Output = class extends TemplateImpl {
	constructor(token, liquid) {
		var _a;
		super(token);
		this.value = new Value(new Tokenizer(token.input, liquid.options.operators, token.file, token.contentRange).readFilteredValue(), liquid);
		const filters$1 = this.value.filters;
		const outputEscape = liquid.options.outputEscape;
		if (!((_a = filters$1[filters$1.length - 1]) === null || _a === void 0 ? void 0 : _a.raw) && outputEscape) {
			const token$1 = new FilterToken(toString.call(outputEscape), [], "", 0, 0);
			filters$1.push(new Filter(token$1, outputEscape, liquid));
		}
	}
	*render(ctx, emitter) {
		const val = yield this.value.value(ctx, false);
		emitter.write(val);
	}
	*arguments() {
		yield this.value;
	}
};
var HTML = class extends TemplateImpl {
	constructor(token) {
		super(token);
		this.str = token.getContent();
	}
	*render(ctx, emitter) {
		emitter.write(this.str);
	}
};
var Variable = class Variable {
	constructor(segments, location) {
		this.segments = segments;
		this.location = location;
	}
	toString() {
		return segmentsString(this.segments, true);
	}
	toArray() {
		function* _visit$1(...segments) {
			for (const segment of segments) if (segment instanceof Variable) yield Array.from(_visit$1(...segment.segments));
			else yield segment;
		}
		return Array.from(_visit$1(...this.segments));
	}
};
var VariableMap = class {
	constructor() {
		this.map = /* @__PURE__ */ new Map();
	}
	get(key) {
		const k = segmentsString([key.segments[0]]);
		if (!this.map.has(k)) this.map.set(k, []);
		return this.map.get(k);
	}
	has(key) {
		return this.map.has(segmentsString([key.segments[0]]));
	}
	push(variable) {
		this.get(variable).push(variable);
	}
	asObject() {
		return Object.fromEntries(this.map);
	}
};
var defaultStaticAnalysisOptions = { partials: true };
function* _analyze(templates, partials, sync) {
	const variables = new VariableMap();
	const globals = new VariableMap();
	const locals = new VariableMap();
	const rootScope = new DummyScope(/* @__PURE__ */ new Set());
	const seen = /* @__PURE__ */ new Set();
	function updateVariables(variable, scope) {
		variables.push(variable);
		const aliased = scope.alias(variable);
		if (aliased !== void 0) {
			const root = aliased.segments[0];
			if (isString(root) && !rootScope.has(root)) globals.push(aliased);
		} else {
			const root = variable.segments[0];
			if (isString(root) && !scope.has(root)) globals.push(variable);
		}
		for (const segment of variable.segments) if (segment instanceof Variable) updateVariables(segment, scope);
	}
	function* visit$2(template$1, scope) {
		if (template$1.arguments) for (const arg of template$1.arguments()) for (const variable of extractVariables(arg)) updateVariables(variable, scope);
		if (template$1.localScope) for (const ident of template$1.localScope()) {
			scope.add(ident.content);
			scope.deleteAlias(ident.content);
			const [row, col] = ident.getPosition();
			locals.push(new Variable([ident.content], {
				row,
				col,
				file: ident.file
			}));
		}
		if (template$1.children) if (template$1.partialScope) {
			const partial = template$1.partialScope();
			if (partial === void 0) {
				for (const child of yield template$1.children(partials, sync)) yield visit$2(child, scope);
				return;
			}
			if (seen.has(partial.name)) return;
			const partialScopeNames = /* @__PURE__ */ new Set();
			const partialScope = partial.isolated ? new DummyScope(partialScopeNames) : scope.push(partialScopeNames);
			for (const name of partial.scope) if (isString(name)) partialScopeNames.add(name);
			else {
				const [alias, argument] = name;
				partialScopeNames.add(alias);
				const variables$1 = Array.from(extractVariables(argument));
				if (variables$1.length) partialScope.setAlias(alias, variables$1[0].segments);
			}
			for (const child of yield template$1.children(partials, sync)) {
				yield visit$2(child, partialScope);
				seen.add(partial.name);
			}
			partialScope.pop();
		} else {
			if (template$1.blockScope) scope.push(new Set(template$1.blockScope()));
			for (const child of yield template$1.children(partials, sync)) yield visit$2(child, scope);
			if (template$1.blockScope) scope.pop();
		}
	}
	for (const template$1 of templates) yield visit$2(template$1, rootScope);
	return {
		variables: variables.asObject(),
		globals: globals.asObject(),
		locals: locals.asObject()
	};
}
function analyze(template$1, options = {}) {
	return toPromise(_analyze(template$1, Object.assign(Object.assign({}, defaultStaticAnalysisOptions), options).partials, false));
}
function analyzeSync(template$1, options = {}) {
	return toValueSync(_analyze(template$1, Object.assign(Object.assign({}, defaultStaticAnalysisOptions), options).partials, true));
}
var DummyScope = class {
	constructor(globals) {
		this.stack = [{
			names: globals,
			aliases: /* @__PURE__ */ new Map()
		}];
	}
	has(name) {
		for (const scope of this.stack) if (scope.names.has(name)) return true;
		return false;
	}
	push(scope) {
		this.stack.push({
			names: scope,
			aliases: /* @__PURE__ */ new Map()
		});
		return this;
	}
	pop() {
		var _a;
		return (_a = this.stack.pop()) === null || _a === void 0 ? void 0 : _a.names;
	}
	add(name) {
		this.stack[0].names.add(name);
	}
	alias(variable) {
		const root = variable.segments[0];
		if (!isString(root)) return void 0;
		const alias = this.getAlias(root);
		if (alias === void 0) return void 0;
		return new Variable([...alias, ...variable.segments.slice(1)], variable.location);
	}
	setAlias(from, to) {
		this.stack[this.stack.length - 1].aliases.set(from, to);
	}
	deleteAlias(name) {
		this.stack[this.stack.length - 1].aliases.delete(name);
	}
	getAlias(name) {
		for (const scope of this.stack) {
			if (scope.aliases.has(name)) return scope.aliases.get(name);
			if (scope.names.has(name)) return;
		}
	}
};
function* extractVariables(value) {
	if (isValueToken(value)) yield* extractValueTokenVariables(value);
	else if (value instanceof Value) yield* extractFilteredValueVariables(value);
}
function* extractFilteredValueVariables(value) {
	for (const token of value.initial.postfix) if (isValueToken(token)) yield* extractValueTokenVariables(token);
	for (const filter$1 of value.filters) for (const arg of filter$1.args) if (isKeyValuePair(arg) && arg[1]) yield* extractValueTokenVariables(arg[1]);
	else if (isValueToken(arg)) yield* extractValueTokenVariables(arg);
}
function* extractValueTokenVariables(token) {
	if (isRangeToken(token)) {
		yield* extractValueTokenVariables(token.lhs);
		yield* extractValueTokenVariables(token.rhs);
	} else if (isPropertyAccessToken(token)) yield extractPropertyAccessVariable(token);
}
function extractPropertyAccessVariable(token) {
	const segments = [];
	let file = token.file;
	const root = token.props[0];
	file = file || root.file;
	if (isQuotedToken(root) || isNumberToken(root) || isWordToken(root)) segments.push(root.content);
	else if (isPropertyAccessToken(root)) segments.push(...extractPropertyAccessVariable(root).segments);
	for (const prop of token.props.slice(1)) {
		file = file || prop.file;
		if (isQuotedToken(prop) || isNumberToken(prop) || isWordToken(prop)) segments.push(prop.content);
		else if (isPropertyAccessToken(prop)) segments.push(extractPropertyAccessVariable(prop));
	}
	const [row, col] = token.getPosition();
	return new Variable(segments, {
		row,
		col,
		file
	});
}
var RE_PROPERTY = /^[\u0080-\uFFFFa-zA-Z_][\u0080-\uFFFFa-zA-Z0-9_-]*$/;
function segmentsString(segments, bracketedRoot = false) {
	const buf = [];
	const root = segments[0];
	if (isString(root)) if (!bracketedRoot || root.match(RE_PROPERTY)) buf.push(`${root}`);
	else buf.push(`['${root}']`);
	for (const segment of segments.slice(1)) if (segment instanceof Variable) buf.push(`[${segmentsString(segment.segments)}]`);
	else if (isString(segment)) if (segment.match(RE_PROPERTY)) buf.push(`.${segment}`);
	else buf.push(`['${segment}']`);
	else buf.push(`[${segment}]`);
	return buf.join("");
}
var LookupType;
(function(LookupType$1) {
	LookupType$1["Partials"] = "partials";
	LookupType$1["Layouts"] = "layouts";
	LookupType$1["Root"] = "root";
})(LookupType || (LookupType = {}));
var Loader = class {
	constructor(options) {
		this.options = options;
		if (options.relativeReference) {
			const sep$1 = options.fs.sep;
			assert(sep$1, "`fs.sep` is required for relative reference");
			const rRelativePath = new RegExp([
				"." + sep$1,
				".." + sep$1,
				"./",
				"../"
			].map((prefix) => escapeRegex(prefix)).join("|"));
			this.shouldLoadRelative = (referencedFile) => rRelativePath.test(referencedFile);
		} else this.shouldLoadRelative = (_referencedFile) => false;
		this.contains = this.options.fs.contains || (() => true);
	}
	*lookup(file, type, sync, currentFile) {
		const { fs: fs$2 } = this.options;
		const dirs = this.options[type];
		for (const filepath of this.candidates(file, dirs, currentFile, type !== LookupType.Root)) if (sync ? fs$2.existsSync(filepath) : yield fs$2.exists(filepath)) return filepath;
		throw this.lookupError(file, dirs);
	}
	*candidates(file, dirs, currentFile, enforceRoot) {
		const { fs: fs$2, extname: extname$1 } = this.options;
		if (this.shouldLoadRelative(file) && currentFile) {
			const referenced = fs$2.resolve(this.dirname(currentFile), file, extname$1);
			for (const dir of dirs) if (!enforceRoot || this.contains(dir, referenced)) {
				yield referenced;
				break;
			}
		}
		for (const dir of dirs) {
			const referenced = fs$2.resolve(dir, file, extname$1);
			if (!enforceRoot || this.contains(dir, referenced)) yield referenced;
		}
		if (fs$2.fallback !== void 0) {
			const filepath = fs$2.fallback(file);
			if (filepath !== void 0) yield filepath;
		}
	}
	dirname(path$1) {
		const fs$2 = this.options.fs;
		assert(fs$2.dirname, "`fs.dirname` is required for relative reference");
		return fs$2.dirname(path$1);
	}
	lookupError(file, roots) {
		const err = /* @__PURE__ */ new Error("ENOENT");
		err.message = `ENOENT: Failed to lookup "${file}" in "${roots}"`;
		err.code = "ENOENT";
		return err;
	}
};
var Parser$1 = class {
	constructor(liquid) {
		this.liquid = liquid;
		this.cache = this.liquid.options.cache;
		this.fs = this.liquid.options.fs;
		this.parseFile = this.cache ? this._parseFileCached : this._parseFile;
		this.loader = new Loader(this.liquid.options);
		this.parseLimit = new Limiter("parse length", liquid.options.parseLimit);
	}
	parse(html, filepath) {
		html = String(html);
		this.parseLimit.use(html.length);
		const tokens = new Tokenizer(html, this.liquid.options.operators, filepath).readTopLevelTokens(this.liquid.options);
		return this.parseTokens(tokens);
	}
	parseTokens(tokens) {
		let token;
		const templates = [];
		const errors = [];
		while (token = tokens.shift()) try {
			templates.push(this.parseToken(token, tokens));
		} catch (err) {
			if (this.liquid.options.catchAllErrors) errors.push(err);
			else throw err;
		}
		if (errors.length) throw new LiquidErrors(errors);
		return templates;
	}
	parseToken(token, remainTokens) {
		try {
			if (isTagToken(token)) {
				const TagClass = this.liquid.tags[token.name];
				assert(TagClass, `tag "${token.name}" not found`);
				return new TagClass(token, remainTokens, this.liquid, this);
			}
			if (isOutputToken(token)) return new Output(token, this.liquid);
			return new HTML(token);
		} catch (e) {
			if (LiquidError.is(e)) throw e;
			throw new ParseError(e, token);
		}
	}
	parseStream(tokens) {
		return new ParseStream(tokens, (token, tokens$1) => this.parseToken(token, tokens$1));
	}
	*_parseFileCached(file, sync, type = LookupType.Root, currentFile) {
		const cache = this.cache;
		const key = this.loader.shouldLoadRelative(file) ? currentFile + "," + file : type + ":" + file;
		const tpls = yield cache.read(key);
		if (tpls) return tpls;
		const task = this._parseFile(file, sync, type, currentFile);
		const taskOrTpl = sync ? yield task : toPromise(task);
		cache.write(key, taskOrTpl);
		try {
			return yield taskOrTpl;
		} catch (err) {
			cache.remove(key);
			throw err;
		}
	}
	*_parseFile(file, sync, type = LookupType.Root, currentFile) {
		const filepath = yield this.loader.lookup(file, type, sync, currentFile);
		return this.parse(sync ? this.fs.readFileSync(filepath) : yield this.fs.readFile(filepath), filepath);
	}
};
var TokenKind;
(function(TokenKind$1) {
	TokenKind$1[TokenKind$1["Number"] = 1] = "Number";
	TokenKind$1[TokenKind$1["Literal"] = 2] = "Literal";
	TokenKind$1[TokenKind$1["Tag"] = 4] = "Tag";
	TokenKind$1[TokenKind$1["Output"] = 8] = "Output";
	TokenKind$1[TokenKind$1["HTML"] = 16] = "HTML";
	TokenKind$1[TokenKind$1["Filter"] = 32] = "Filter";
	TokenKind$1[TokenKind$1["Hash"] = 64] = "Hash";
	TokenKind$1[TokenKind$1["PropertyAccess"] = 128] = "PropertyAccess";
	TokenKind$1[TokenKind$1["Word"] = 256] = "Word";
	TokenKind$1[TokenKind$1["Range"] = 512] = "Range";
	TokenKind$1[TokenKind$1["Quoted"] = 1024] = "Quoted";
	TokenKind$1[TokenKind$1["Operator"] = 2048] = "Operator";
	TokenKind$1[TokenKind$1["FilteredValue"] = 4096] = "FilteredValue";
	TokenKind$1[TokenKind$1["Delimited"] = 12] = "Delimited";
})(TokenKind || (TokenKind = {}));
function isDelimitedToken(val) {
	return !!(getKind(val) & TokenKind.Delimited);
}
function isOperatorToken(val) {
	return getKind(val) === TokenKind.Operator;
}
function isHTMLToken(val) {
	return getKind(val) === TokenKind.HTML;
}
function isOutputToken(val) {
	return getKind(val) === TokenKind.Output;
}
function isTagToken(val) {
	return getKind(val) === TokenKind.Tag;
}
function isQuotedToken(val) {
	return getKind(val) === TokenKind.Quoted;
}
function isNumberToken(val) {
	return getKind(val) === TokenKind.Number;
}
function isPropertyAccessToken(val) {
	return getKind(val) === TokenKind.PropertyAccess;
}
function isWordToken(val) {
	return getKind(val) === TokenKind.Word;
}
function isRangeToken(val) {
	return getKind(val) === TokenKind.Range;
}
function isValueToken(val) {
	return (getKind(val) & 1667) > 0;
}
function getKind(val) {
	return val ? val.kind : -1;
}
var Context = class Context {
	constructor(env = {}, opts = defaultOptions, renderOptions = {}, { memoryLimit, renderLimit } = {}) {
		var _a, _b, _c, _d, _e;
		this.scopes = [{}];
		this.registers = {};
		this.breakCalled = false;
		this.continueCalled = false;
		this.sync = !!renderOptions.sync;
		this.opts = opts;
		this.globals = (_a = renderOptions.globals) !== null && _a !== void 0 ? _a : opts.globals;
		this.environments = isObject(env) ? env : Object(env);
		this.strictVariables = (_b = renderOptions.strictVariables) !== null && _b !== void 0 ? _b : this.opts.strictVariables;
		this.ownPropertyOnly = (_c = renderOptions.ownPropertyOnly) !== null && _c !== void 0 ? _c : opts.ownPropertyOnly;
		this.memoryLimit = memoryLimit !== null && memoryLimit !== void 0 ? memoryLimit : new Limiter("memory alloc", (_d = renderOptions.memoryLimit) !== null && _d !== void 0 ? _d : opts.memoryLimit);
		this.renderLimit = renderLimit !== null && renderLimit !== void 0 ? renderLimit : new Limiter("template render", getPerformance().now() + ((_e = renderOptions.renderLimit) !== null && _e !== void 0 ? _e : opts.renderLimit));
	}
	getRegister(key) {
		return this.registers[key] = this.registers[key] || {};
	}
	setRegister(key, value) {
		return this.registers[key] = value;
	}
	saveRegister(...keys) {
		return keys.map((key) => [key, this.getRegister(key)]);
	}
	restoreRegister(keyValues) {
		return keyValues.forEach(([key, value]) => this.setRegister(key, value));
	}
	getAll() {
		return [
			this.globals,
			this.environments,
			...this.scopes
		].reduce((ctx, val) => __assign(ctx, val), {});
	}
	get(paths) {
		return this.getSync(paths);
	}
	getSync(paths) {
		return toValueSync(this._get(paths));
	}
	*_get(paths) {
		const scope = this.findScope(paths[0]);
		return yield this._getFromScope(scope, paths);
	}
	getFromScope(scope, paths) {
		return toValueSync(this._getFromScope(scope, paths));
	}
	*_getFromScope(scope, paths, strictVariables = this.strictVariables) {
		if (isString(paths)) paths = paths.split(".");
		for (let i = 0; i < paths.length; i++) {
			scope = yield this.readProperty(scope, paths[i]);
			if (strictVariables && isUndefined(scope)) throw new InternalUndefinedVariableError(paths.slice(0, i + 1).join("."));
		}
		return scope;
	}
	push(ctx) {
		return this.scopes.push(ctx);
	}
	pop() {
		return this.scopes.pop();
	}
	bottom() {
		return this.scopes[0];
	}
	spawn(scope = {}) {
		return new Context(scope, this.opts, {
			sync: this.sync,
			globals: this.globals,
			strictVariables: this.strictVariables
		}, {
			renderLimit: this.renderLimit,
			memoryLimit: this.memoryLimit
		});
	}
	findScope(key) {
		for (let i = this.scopes.length - 1; i >= 0; i--) {
			const candidate = this.scopes[i];
			if (key in candidate) return candidate;
		}
		if (key in this.environments) return this.environments;
		return this.globals;
	}
	readProperty(obj, key) {
		obj = toLiquid(obj);
		key = toValue(key);
		if (isNil(obj)) return obj;
		if (isArray(obj) && key < 0) return obj[obj.length + +key];
		const value = readJSProperty(obj, key, this.ownPropertyOnly);
		if (value === void 0 && obj instanceof Drop) return obj.liquidMethodMissing(key, this);
		if (isFunction(value)) return value.call(obj);
		if (key === "size") return readSize(obj);
		else if (key === "first") return readFirst(obj);
		else if (key === "last") return readLast(obj);
		return value;
	}
};
function readJSProperty(obj, key, ownPropertyOnly) {
	if (ownPropertyOnly && !hasOwnProperty.call(obj, key) && !(obj instanceof Drop)) return void 0;
	return obj[key];
}
function readFirst(obj) {
	if (isArray(obj)) return obj[0];
	return obj["first"];
}
function readLast(obj) {
	if (isArray(obj)) return obj[obj.length - 1];
	return obj["last"];
}
function readSize(obj) {
	if (hasOwnProperty.call(obj, "size") || obj["size"] !== void 0) return obj["size"];
	if (isArray(obj) || isString(obj)) return obj.length;
	if (typeof obj === "object") return Object.keys(obj).length;
}
var BlockMode;
(function(BlockMode$1) {
	BlockMode$1[BlockMode$1["OUTPUT"] = 0] = "OUTPUT";
	BlockMode$1[BlockMode$1["STORE"] = 1] = "STORE";
})(BlockMode || (BlockMode = {}));
var abs = argumentsToNumber(Math.abs);
var at_least = argumentsToNumber(Math.max);
var at_most = argumentsToNumber(Math.min);
var ceil = argumentsToNumber(Math.ceil);
var divided_by = argumentsToNumber((dividend, divisor, integerArithmetic = false) => integerArithmetic ? Math.floor(dividend / divisor) : dividend / divisor);
var floor = argumentsToNumber(Math.floor);
var minus = argumentsToNumber((v, arg) => v - arg);
var plus = argumentsToNumber((lhs, rhs) => lhs + rhs);
var modulo = argumentsToNumber((v, arg) => v % arg);
var times = argumentsToNumber((v, arg) => v * arg);
function round(v, arg = 0) {
	v = toNumber(v);
	arg = toNumber(arg);
	const amp = Math.pow(10, arg);
	return Math.round(v * amp) / amp;
}
var mathFilters = /* @__PURE__ */ Object.freeze({
	__proto__: null,
	abs,
	at_least,
	at_most,
	ceil,
	divided_by,
	floor,
	minus,
	plus,
	modulo,
	times,
	round
});
var url_decode = (x) => decodeURIComponent(stringify(x)).replace(/\+/g, " ");
var url_encode = (x) => encodeURIComponent(stringify(x)).replace(/%20/g, "+");
var cgi_escape = (x) => encodeURIComponent(stringify(x)).replace(/%20/g, "+").replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
var uri_escape = (x) => encodeURI(stringify(x)).replace(/%5B/g, "[").replace(/%5D/g, "]");
var rSlugifyDefault = /[^\p{M}\p{L}\p{Nd}]+/gu;
var rSlugifyReplacers = {
	"raw": /\s+/g,
	"default": rSlugifyDefault,
	"pretty": /[^\p{M}\p{L}\p{Nd}._~!$&'()+,;=@]+/gu,
	"ascii": /[^A-Za-z0-9]+/g,
	"latin": rSlugifyDefault,
	"none": null
};
function slugify(str, mode = "default", cased = false) {
	str = stringify(str);
	const replacer = rSlugifyReplacers[mode];
	if (replacer) {
		if (mode === "latin") str = removeAccents(str);
		str = str.replace(replacer, "-").replace(/^-|-$/g, "");
	}
	return cased ? str : str.toLowerCase();
}
function removeAccents(str) {
	return str.replace(/[àáâãäå]/g, "a").replace(/[æ]/g, "ae").replace(/[ç]/g, "c").replace(/[èéêë]/g, "e").replace(/[ìíîï]/g, "i").replace(/[ð]/g, "d").replace(/[ñ]/g, "n").replace(/[òóôõöø]/g, "o").replace(/[ùúûü]/g, "u").replace(/[ýÿ]/g, "y").replace(/[ß]/g, "ss").replace(/[œ]/g, "oe").replace(/[þ]/g, "th").replace(/[ẞ]/g, "SS").replace(/[Œ]/g, "OE").replace(/[Þ]/g, "TH");
}
var urlFilters = /* @__PURE__ */ Object.freeze({
	__proto__: null,
	url_decode,
	url_encode,
	cgi_escape,
	uri_escape,
	slugify
});
var join = argumentsToValue(function(v, arg) {
	const array = toArray(v);
	const sep$1 = isNil(arg) ? " " : stringify(arg);
	const complexity = array.length * (1 + sep$1.length);
	this.context.memoryLimit.use(complexity);
	return array.join(sep$1);
});
var last$1 = argumentsToValue((v) => isArrayLike(v) ? last(v) : "");
var first = argumentsToValue((v) => isArrayLike(v) ? v[0] : "");
var reverse = argumentsToValue(function(v) {
	const array = toArray(v);
	this.context.memoryLimit.use(array.length);
	return [...array].reverse();
});
function* sort(arr, property) {
	const values = [];
	const array = toArray(arr);
	this.context.memoryLimit.use(array.length);
	for (const item of array) values.push([item, property ? yield this.context._getFromScope(item, stringify(property).split("."), false) : item]);
	return values.sort((lhs, rhs) => {
		const lvalue = lhs[1];
		const rvalue = rhs[1];
		return lvalue < rvalue ? -1 : lvalue > rvalue ? 1 : 0;
	}).map((tuple) => tuple[0]);
}
function sort_natural(input, property) {
	const propertyString = stringify(property);
	const compare = property === void 0 ? caseInsensitiveCompare : (lhs, rhs) => caseInsensitiveCompare(lhs[propertyString], rhs[propertyString]);
	const array = toArray(input);
	this.context.memoryLimit.use(array.length);
	return [...array].sort(compare);
}
var size = (v) => v && v.length || 0;
function* map(arr, property) {
	const results = [];
	const array = toArray(arr);
	this.context.memoryLimit.use(array.length);
	for (const item of array) results.push(yield this.context._getFromScope(item, stringify(property), false));
	return results;
}
function* sum(arr, property) {
	let sum$1 = 0;
	const array = toArray(arr);
	for (const item of array) {
		const data = Number(property ? yield this.context._getFromScope(item, stringify(property), false) : item);
		sum$1 += Number.isNaN(data) ? 0 : data;
	}
	return sum$1;
}
function compact(arr) {
	const array = toArray(arr);
	this.context.memoryLimit.use(array.length);
	return array.filter((x) => !isNil(toValue(x)));
}
function concat(v, arg = []) {
	const lhs = toArray(v);
	const rhs = toArray(arg);
	this.context.memoryLimit.use(lhs.length + rhs.length);
	return lhs.concat(rhs);
}
function push(v, arg) {
	return concat.call(this, v, [arg]);
}
function unshift(v, arg) {
	const array = toArray(v);
	this.context.memoryLimit.use(array.length);
	const clone = [...array];
	clone.unshift(arg);
	return clone;
}
function pop(v) {
	const clone = [...toArray(v)];
	clone.pop();
	return clone;
}
function shift(v) {
	const array = toArray(v);
	this.context.memoryLimit.use(array.length);
	const clone = [...array];
	clone.shift();
	return clone;
}
function slice(v, begin, length = 1) {
	v = toValue(v);
	if (isNil(v)) return [];
	if (!isArray(v)) v = stringify(v);
	begin = begin < 0 ? v.length + begin : begin;
	this.context.memoryLimit.use(length);
	return v.slice(begin, begin + length);
}
function expectedMatcher(expected) {
	if (this.context.opts.jekyllWhere) return (v) => EmptyDrop.is(expected) ? equals(v, expected) : isArray(v) ? arrayIncludes(v, expected) : equals(v, expected);
	else if (expected === void 0) return (v) => isTruthy(v, this.context);
	else return (v) => equals(v, expected);
}
function* filter(include, arr, property, expected) {
	const values = [];
	arr = toArray(arr);
	this.context.memoryLimit.use(arr.length);
	const token = new Tokenizer(stringify(property)).readScopeValue();
	for (const item of arr) values.push(yield evalToken(token, this.context.spawn(item)));
	const matcher = expectedMatcher.call(this, expected);
	return arr.filter((_, i) => matcher(values[i]) === include);
}
function* filter_exp(include, arr, itemName, exp) {
	const filtered = [];
	const keyTemplate = new Value(stringify(exp), this.liquid);
	const array = toArray(arr);
	this.context.memoryLimit.use(array.length);
	for (const item of array) {
		this.context.push({ [itemName]: item });
		const value = yield keyTemplate.value(this.context);
		this.context.pop();
		if (value === include) filtered.push(item);
	}
	return filtered;
}
function* where(arr, property, expected) {
	return yield* filter.call(this, true, arr, property, expected);
}
function* reject(arr, property, expected) {
	return yield* filter.call(this, false, arr, property, expected);
}
function* where_exp(arr, itemName, exp) {
	return yield* filter_exp.call(this, true, arr, itemName, exp);
}
function* reject_exp(arr, itemName, exp) {
	return yield* filter_exp.call(this, false, arr, itemName, exp);
}
function* group_by(arr, property) {
	const map$2 = /* @__PURE__ */ new Map();
	arr = toEnumerable(arr);
	const token = new Tokenizer(stringify(property)).readScopeValue();
	this.context.memoryLimit.use(arr.length);
	for (const item of arr) {
		const key = yield evalToken(token, this.context.spawn(item));
		if (!map$2.has(key)) map$2.set(key, []);
		map$2.get(key).push(item);
	}
	return [...map$2.entries()].map(([name, items]) => ({
		name,
		items
	}));
}
function* group_by_exp(arr, itemName, exp) {
	const map$2 = /* @__PURE__ */ new Map();
	const keyTemplate = new Value(stringify(exp), this.liquid);
	arr = toEnumerable(arr);
	this.context.memoryLimit.use(arr.length);
	for (const item of arr) {
		this.context.push({ [itemName]: item });
		const key = yield keyTemplate.value(this.context);
		this.context.pop();
		if (!map$2.has(key)) map$2.set(key, []);
		map$2.get(key).push(item);
	}
	return [...map$2.entries()].map(([name, items]) => ({
		name,
		items
	}));
}
function* search(arr, property, expected) {
	const token = new Tokenizer(stringify(property)).readScopeValue();
	const array = toArray(arr);
	const matcher = expectedMatcher.call(this, expected);
	for (let index = 0; index < array.length; index++) if (matcher(yield evalToken(token, this.context.spawn(array[index])))) return [index, array[index]];
}
function* search_exp(arr, itemName, exp) {
	const predicate = new Value(stringify(exp), this.liquid);
	const array = toArray(arr);
	for (let index = 0; index < array.length; index++) {
		this.context.push({ [itemName]: array[index] });
		const value = yield predicate.value(this.context);
		this.context.pop();
		if (value) return [index, array[index]];
	}
}
function* has(arr, property, expected) {
	return !!(yield* search.call(this, arr, property, expected));
}
function* has_exp(arr, itemName, exp) {
	return !!(yield* search_exp.call(this, arr, itemName, exp));
}
function* find_index(arr, property, expected) {
	const result = yield* search.call(this, arr, property, expected);
	return result ? result[0] : void 0;
}
function* find_index_exp(arr, itemName, exp) {
	const result = yield* search_exp.call(this, arr, itemName, exp);
	return result ? result[0] : void 0;
}
function* find(arr, property, expected) {
	const result = yield* search.call(this, arr, property, expected);
	return result ? result[1] : void 0;
}
function* find_exp(arr, itemName, exp) {
	const result = yield* search_exp.call(this, arr, itemName, exp);
	return result ? result[1] : void 0;
}
function uniq(arr) {
	arr = toArray(arr);
	this.context.memoryLimit.use(arr.length);
	return [...new Set(arr)];
}
function sample(v, count = 1) {
	v = toValue(v);
	if (isNil(v)) return [];
	if (!isArray(v)) v = stringify(v);
	this.context.memoryLimit.use(count);
	const shuffled = [...v].sort(() => Math.random() - .5);
	if (count === 1) return shuffled[0];
	return shuffled.slice(0, count);
}
var arrayFilters = /* @__PURE__ */ Object.freeze({
	__proto__: null,
	join,
	last: last$1,
	first,
	reverse,
	sort,
	sort_natural,
	size,
	map,
	sum,
	compact,
	concat,
	push,
	unshift,
	pop,
	shift,
	slice,
	where,
	reject,
	where_exp,
	reject_exp,
	group_by,
	group_by_exp,
	has,
	has_exp,
	find_index,
	find_index_exp,
	find,
	find_exp,
	uniq,
	sample
});
function date(v, format$1, timezoneOffset) {
	var _a, _b, _c;
	const size$1 = ((_a = v === null || v === void 0 ? void 0 : v.length) !== null && _a !== void 0 ? _a : 0) + ((_b = format$1 === null || format$1 === void 0 ? void 0 : format$1.length) !== null && _b !== void 0 ? _b : 0) + ((_c = timezoneOffset === null || timezoneOffset === void 0 ? void 0 : timezoneOffset.length) !== null && _c !== void 0 ? _c : 0);
	this.context.memoryLimit.use(size$1);
	const date$1 = parseDate(v, this.context.opts, timezoneOffset);
	if (!date$1) return v;
	format$1 = toValue(format$1);
	format$1 = isNil(format$1) ? this.context.opts.dateFormat : stringify(format$1);
	return strftime(date$1, format$1);
}
function date_to_xmlschema(v) {
	return date.call(this, v, "%Y-%m-%dT%H:%M:%S%:z");
}
function date_to_rfc822(v) {
	return date.call(this, v, "%a, %d %b %Y %H:%M:%S %z");
}
function date_to_string(v, type, style) {
	return stringify_date.call(this, v, "%b", type, style);
}
function date_to_long_string(v, type, style) {
	return stringify_date.call(this, v, "%B", type, style);
}
function stringify_date(v, month_type, type, style) {
	const date$1 = parseDate(v, this.context.opts);
	if (!date$1) return v;
	if (type === "ordinal") {
		const d = date$1.getDate();
		return style === "US" ? strftime(date$1, `${month_type} ${d}%q, %Y`) : strftime(date$1, `${d}%q ${month_type} %Y`);
	}
	return strftime(date$1, `%d ${month_type} %Y`);
}
function parseDate(v, opts, timezoneOffset) {
	let date$1;
	const defaultTimezoneOffset = timezoneOffset !== null && timezoneOffset !== void 0 ? timezoneOffset : opts.timezoneOffset;
	const locale = opts.locale;
	v = toValue(v);
	if (v === "now" || v === "today") date$1 = new LiquidDate(Date.now(), locale, defaultTimezoneOffset);
	else if (isNumber(v)) date$1 = new LiquidDate(v * 1e3, locale, defaultTimezoneOffset);
	else if (isString(v)) if (/^\d+$/.test(v)) date$1 = new LiquidDate(+v * 1e3, locale, defaultTimezoneOffset);
	else if (opts.preserveTimezones && timezoneOffset === void 0) date$1 = LiquidDate.createDateFixedToTimezone(v, locale);
	else date$1 = new LiquidDate(v, locale, defaultTimezoneOffset);
	else date$1 = new LiquidDate(v, locale, defaultTimezoneOffset);
	return date$1.valid() ? date$1 : void 0;
}
var dateFilters = /* @__PURE__ */ Object.freeze({
	__proto__: null,
	date,
	date_to_xmlschema,
	date_to_rfc822,
	date_to_string,
	date_to_long_string
});
var rCJKWord = /[\u4E00-\u9FFF\uF900-\uFAFF\u3400-\u4DBF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/gu;
var rNonCJKWord = /[^\u4E00-\u9FFF\uF900-\uFAFF\u3400-\u4DBF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF\s]+/gu;
function append(v, arg) {
	assert(arguments.length === 2, "append expect 2 arguments");
	const lhs = stringify(v);
	const rhs = stringify(arg);
	this.context.memoryLimit.use(lhs.length + rhs.length);
	return lhs + rhs;
}
function prepend(v, arg) {
	assert(arguments.length === 2, "prepend expect 2 arguments");
	const lhs = stringify(v);
	const rhs = stringify(arg);
	this.context.memoryLimit.use(lhs.length + rhs.length);
	return rhs + lhs;
}
function lstrip(v, chars) {
	const str = stringify(v);
	this.context.memoryLimit.use(str.length);
	if (chars) {
		chars = escapeRegExp(stringify(chars));
		return str.replace(new RegExp(`^[${chars}]+`, "g"), "");
	}
	return str.replace(/^\s+/, "");
}
function downcase(v) {
	const str = stringify(v);
	this.context.memoryLimit.use(str.length);
	return str.toLowerCase();
}
function upcase(v) {
	const str = stringify(v);
	this.context.memoryLimit.use(str.length);
	return stringify(str).toUpperCase();
}
function remove(v, arg) {
	const str = stringify(v);
	this.context.memoryLimit.use(str.length);
	return str.split(stringify(arg)).join("");
}
function remove_first(v, l) {
	const str = stringify(v);
	this.context.memoryLimit.use(str.length);
	return str.replace(stringify(l), "");
}
function remove_last(v, l) {
	const str = stringify(v);
	this.context.memoryLimit.use(str.length);
	const pattern = stringify(l);
	const index = str.lastIndexOf(pattern);
	if (index === -1) return str;
	return str.substring(0, index) + str.substring(index + pattern.length);
}
function rstrip(str, chars) {
	str = stringify(str);
	this.context.memoryLimit.use(str.length);
	if (chars) {
		chars = escapeRegExp(stringify(chars));
		return str.replace(new RegExp(`[${chars}]+$`, "g"), "");
	}
	return str.replace(/\s+$/, "");
}
function split(v, arg) {
	const str = stringify(v);
	this.context.memoryLimit.use(str.length);
	const arr = str.split(stringify(arg));
	while (arr.length && arr[arr.length - 1] === "") arr.pop();
	return arr;
}
function strip(v, chars) {
	const str = stringify(v);
	this.context.memoryLimit.use(str.length);
	if (chars) {
		chars = escapeRegExp(stringify(chars));
		return str.replace(new RegExp(`^[${chars}]+`, "g"), "").replace(new RegExp(`[${chars}]+$`, "g"), "");
	}
	return str.trim();
}
function strip_newlines(v) {
	const str = stringify(v);
	this.context.memoryLimit.use(str.length);
	return str.replace(/\r?\n/gm, "");
}
function capitalize(str) {
	str = stringify(str);
	this.context.memoryLimit.use(str.length);
	return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
function replace(v, pattern, replacement) {
	const str = stringify(v);
	this.context.memoryLimit.use(str.length);
	return str.split(stringify(pattern)).join(replacement);
}
function replace_first(v, arg1, arg2) {
	const str = stringify(v);
	this.context.memoryLimit.use(str.length);
	return str.replace(stringify(arg1), arg2);
}
function replace_last(v, arg1, arg2) {
	const str = stringify(v);
	this.context.memoryLimit.use(str.length);
	const pattern = stringify(arg1);
	const index = str.lastIndexOf(pattern);
	if (index === -1) return str;
	const replacement = stringify(arg2);
	return str.substring(0, index) + replacement + str.substring(index + pattern.length);
}
function truncate(v, l = 50, o = "...") {
	const str = stringify(v);
	this.context.memoryLimit.use(str.length);
	if (str.length <= l) return v;
	return str.substring(0, l - o.length) + o;
}
function truncatewords(v, words = 15, o = "...") {
	const str = stringify(v);
	this.context.memoryLimit.use(str.length);
	const arr = str.split(/\s+/);
	if (words <= 0) words = 1;
	let ret = arr.slice(0, words).join(" ");
	if (arr.length >= words) ret += o;
	return ret;
}
function normalize_whitespace(v) {
	const str = stringify(v);
	this.context.memoryLimit.use(str.length);
	return str.replace(/\s+/g, " ");
}
function number_of_words(input, mode) {
	const str = stringify(input);
	this.context.memoryLimit.use(str.length);
	input = str.trim();
	if (!input) return 0;
	switch (mode) {
		case "cjk": return (input.match(rCJKWord) || []).length + (input.match(rNonCJKWord) || []).length;
		case "auto": return rCJKWord.test(input) ? input.match(rCJKWord).length + (input.match(rNonCJKWord) || []).length : input.split(/\s+/).length;
		default: return input.split(/\s+/).length;
	}
}
function array_to_sentence_string(array, connector = "and") {
	this.context.memoryLimit.use(array.length);
	switch (array.length) {
		case 0: return "";
		case 1: return array[0];
		case 2: return `${array[0]} ${connector} ${array[1]}`;
		default: return `${array.slice(0, -1).join(", ")}, ${connector} ${array[array.length - 1]}`;
	}
}
var stringFilters = /* @__PURE__ */ Object.freeze({
	__proto__: null,
	append,
	prepend,
	lstrip,
	downcase,
	upcase,
	remove,
	remove_first,
	remove_last,
	rstrip,
	split,
	strip,
	strip_newlines,
	capitalize,
	replace,
	replace_first,
	replace_last,
	truncate,
	truncatewords,
	normalize_whitespace,
	number_of_words,
	array_to_sentence_string
});
function base64Encode(str) {
	return Buffer.from(str, "utf8").toString("base64");
}
function base64Decode(str) {
	return Buffer.from(str, "base64").toString("utf8");
}
function base64_encode(value) {
	const str = stringify(value);
	this.context.memoryLimit.use(str.length);
	return base64Encode(str);
}
function base64_decode(value) {
	const str = stringify(value);
	this.context.memoryLimit.use(str.length);
	return base64Decode(str);
}
var base64Filters = /* @__PURE__ */ Object.freeze({
	__proto__: null,
	base64_encode,
	base64_decode
});
var filters = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, htmlFilters), mathFilters), urlFilters), arrayFilters), dateFilters), stringFilters), base64Filters), misc);
var AssignTag = class extends Tag {
	constructor(token, remainTokens, liquid) {
		super(token, remainTokens, liquid);
		this.identifier = this.tokenizer.readIdentifier();
		this.key = this.identifier.content;
		this.tokenizer.assert(this.key, "expected variable name");
		this.tokenizer.skipBlank();
		this.tokenizer.assert(this.tokenizer.peek() === "=", "expected \"=\"");
		this.tokenizer.advance();
		this.value = new Value(this.tokenizer.readFilteredValue(), this.liquid);
	}
	*render(ctx) {
		ctx.bottom()[this.key] = yield this.value.value(ctx, this.liquid.options.lenientIf);
	}
	*arguments() {
		yield this.value;
	}
	*localScope() {
		yield this.identifier;
	}
};
var MODIFIERS = [
	"offset",
	"limit",
	"reversed"
];
var ForTag = class extends Tag {
	constructor(token, remainTokens, liquid, parser) {
		super(token, remainTokens, liquid);
		const variable = this.tokenizer.readIdentifier();
		const inStr = this.tokenizer.readIdentifier();
		const collection = this.tokenizer.readValue();
		if (!variable.size() || inStr.content !== "in" || !collection) throw new Error(`illegal tag: ${token.getText()}`);
		this.variable = variable.content;
		this.collection = collection;
		this.hash = new Hash(this.tokenizer, liquid.options.keyValueSeparator);
		this.templates = [];
		this.elseTemplates = [];
		let p;
		const stream = parser.parseStream(remainTokens).on("start", () => p = this.templates).on("tag:else", (tag) => {
			assertEmpty(tag.args);
			p = this.elseTemplates;
		}).on("tag:endfor", (tag) => {
			assertEmpty(tag.args);
			stream.stop();
		}).on("template", (tpl) => p.push(tpl)).on("end", () => {
			throw new Error(`tag ${token.getText()} not closed`);
		});
		stream.start();
	}
	*render(ctx, emitter) {
		const r = this.liquid.renderer;
		let collection = toEnumerable(yield evalToken(this.collection, ctx));
		if (!collection.length) {
			yield r.renderTemplates(this.elseTemplates, ctx, emitter);
			return;
		}
		const continueKey = "continue-" + this.variable + "-" + this.collection.getText();
		ctx.push({ continue: ctx.getRegister(continueKey) });
		const hash = yield this.hash.render(ctx);
		ctx.pop();
		collection = (this.liquid.options.orderedFilterParameters ? Object.keys(hash).filter((x) => MODIFIERS.includes(x)) : MODIFIERS.filter((x) => hash[x] !== void 0)).reduce((collection$1, modifier) => {
			if (modifier === "offset") return offset(collection$1, hash["offset"]);
			if (modifier === "limit") return limit(collection$1, hash["limit"]);
			return reversed(collection$1);
		}, collection);
		ctx.setRegister(continueKey, (hash["offset"] || 0) + collection.length);
		const scope = { forloop: new ForloopDrop(collection.length, this.collection.getText(), this.variable) };
		ctx.push(scope);
		for (const item of collection) {
			scope[this.variable] = item;
			ctx.continueCalled = ctx.breakCalled = false;
			yield r.renderTemplates(this.templates, ctx, emitter);
			if (ctx.breakCalled) break;
			scope.forloop.next();
		}
		ctx.continueCalled = ctx.breakCalled = false;
		ctx.pop();
	}
	*children() {
		const templates = this.templates.slice();
		if (this.elseTemplates) templates.push(...this.elseTemplates);
		return templates;
	}
	*arguments() {
		yield this.collection;
		for (const v of Object.values(this.hash.hash)) if (isValueToken(v)) yield v;
	}
	blockScope() {
		return [this.variable, "forloop"];
	}
};
function reversed(arr) {
	return [...arr].reverse();
}
function offset(arr, count) {
	return arr.slice(count);
}
function limit(arr, count) {
	return arr.slice(0, count);
}
var CaptureTag = class extends Tag {
	constructor(tagToken, remainTokens, liquid, parser) {
		super(tagToken, remainTokens, liquid);
		this.templates = [];
		this.identifier = this.readVariable();
		this.variable = this.identifier.content;
		while (remainTokens.length) {
			const token = remainTokens.shift();
			if (isTagToken(token) && token.name === "endcapture") return;
			this.templates.push(parser.parseToken(token, remainTokens));
		}
		throw new Error(`tag ${tagToken.getText()} not closed`);
	}
	readVariable() {
		let ident = this.tokenizer.readIdentifier();
		if (ident.content) return ident;
		ident = this.tokenizer.readQuoted();
		if (ident) return ident;
		throw this.tokenizer.error("invalid capture name");
	}
	*render(ctx) {
		const html = yield this.liquid.renderer.renderTemplates(this.templates, ctx);
		ctx.bottom()[this.variable] = html;
	}
	*children() {
		return this.templates;
	}
	*localScope() {
		yield this.identifier;
	}
};
var CaseTag = class extends Tag {
	constructor(tagToken, remainTokens, liquid, parser) {
		super(tagToken, remainTokens, liquid);
		this.branches = [];
		this.elseTemplates = [];
		this.value = new Value(this.tokenizer.readFilteredValue(), this.liquid);
		this.elseTemplates = [];
		let p = [];
		let elseCount = 0;
		const stream = parser.parseStream(remainTokens).on("tag:when", (token) => {
			if (elseCount > 0) return;
			p = [];
			const values = [];
			while (!token.tokenizer.end()) {
				values.push(token.tokenizer.readValueOrThrow());
				token.tokenizer.skipBlank();
				if (token.tokenizer.peek() === ",") token.tokenizer.readTo(",");
				else token.tokenizer.readTo("or");
			}
			this.branches.push({
				values,
				templates: p
			});
		}).on("tag:else", () => {
			elseCount++;
			p = this.elseTemplates;
		}).on("tag:endcase", () => stream.stop()).on("template", (tpl) => {
			if (p !== this.elseTemplates || elseCount === 1) p.push(tpl);
		}).on("end", () => {
			throw new Error(`tag ${tagToken.getText()} not closed`);
		});
		stream.start();
	}
	*render(ctx, emitter) {
		const r = this.liquid.renderer;
		const target = toValue(yield this.value.value(ctx, ctx.opts.lenientIf));
		let branchHit = false;
		for (const branch of this.branches) for (const valueToken of branch.values) if (equals(target, yield evalToken(valueToken, ctx, ctx.opts.lenientIf))) {
			yield r.renderTemplates(branch.templates, ctx, emitter);
			branchHit = true;
			break;
		}
		if (!branchHit) yield r.renderTemplates(this.elseTemplates, ctx, emitter);
	}
	*arguments() {
		yield this.value;
		yield* this.branches.flatMap((b) => b.values);
	}
	*children() {
		const templates = this.branches.flatMap((b) => b.templates);
		if (this.elseTemplates) templates.push(...this.elseTemplates);
		return templates;
	}
};
var CommentTag = class extends Tag {
	constructor(tagToken, remainTokens, liquid) {
		super(tagToken, remainTokens, liquid);
		while (remainTokens.length) {
			const token = remainTokens.shift();
			if (isTagToken(token) && token.name === "endcomment") return;
		}
		throw new Error(`tag ${tagToken.getText()} not closed`);
	}
	render() {}
};
var RenderTag = class extends Tag {
	constructor(token, remainTokens, liquid, parser) {
		super(token, remainTokens, liquid);
		const tokenizer = this.tokenizer;
		this.file = parseFilePath(tokenizer, this.liquid, parser);
		this.currentFile = token.file;
		while (!tokenizer.end()) {
			tokenizer.skipBlank();
			const begin = tokenizer.p;
			const keyword = tokenizer.readIdentifier();
			if (keyword.content === "with" || keyword.content === "for") {
				tokenizer.skipBlank();
				if (tokenizer.peek() !== ":") {
					const value = tokenizer.readValue();
					if (value) {
						const beforeAs = tokenizer.p;
						const asStr = tokenizer.readIdentifier();
						let alias;
						if (asStr.content === "as") alias = tokenizer.readIdentifier();
						else tokenizer.p = beforeAs;
						this[keyword.content] = {
							value,
							alias: alias && alias.content
						};
						tokenizer.skipBlank();
						if (tokenizer.peek() === ",") tokenizer.advance();
						continue;
					}
				}
			}
			tokenizer.p = begin;
			break;
		}
		this.hash = new Hash(tokenizer, liquid.options.keyValueSeparator);
	}
	*render(ctx, emitter) {
		const { liquid, hash } = this;
		const filepath = yield renderFilePath(this["file"], ctx, liquid);
		assert(filepath, () => `illegal file path "${filepath}"`);
		const childCtx = ctx.spawn();
		const scope = childCtx.bottom();
		__assign(scope, yield hash.render(ctx));
		if (this["with"]) {
			const { value, alias } = this["with"];
			scope[alias || filepath] = yield evalToken(value, ctx);
		}
		if (this["for"]) {
			const { value, alias } = this["for"];
			const collection = toEnumerable(yield evalToken(value, ctx));
			scope["forloop"] = new ForloopDrop(collection.length, value.getText(), alias);
			for (const item of collection) {
				scope[alias] = item;
				const templates = yield liquid._parsePartialFile(filepath, childCtx.sync, this["currentFile"]);
				yield liquid.renderer.renderTemplates(templates, childCtx, emitter);
				scope["forloop"].next();
			}
		} else {
			const templates = yield liquid._parsePartialFile(filepath, childCtx.sync, this["currentFile"]);
			yield liquid.renderer.renderTemplates(templates, childCtx, emitter);
		}
	}
	*children(partials, sync) {
		if (partials && isString(this["file"])) return yield this.liquid._parsePartialFile(this["file"], sync, this["currentFile"]);
		return [];
	}
	partialScope() {
		if (isString(this["file"])) {
			const names = Object.keys(this.hash.hash);
			if (this["with"]) {
				const { value, alias } = this["with"];
				if (isString(alias)) names.push([alias, value]);
				else if (isString(this.file)) names.push([this.file, value]);
			}
			if (this["for"]) {
				const { value, alias } = this["for"];
				if (isString(alias)) names.push([alias, value]);
				else if (isString(this.file)) names.push([this.file, value]);
			}
			return {
				name: this["file"],
				isolated: true,
				scope: names
			};
		}
	}
	*arguments() {
		for (const v of Object.values(this.hash.hash)) if (isValueToken(v)) yield v;
		if (this["with"]) {
			const { value } = this["with"];
			if (isValueToken(value)) yield value;
		}
		if (this["for"]) {
			const { value } = this["for"];
			if (isValueToken(value)) yield value;
		}
	}
};
function parseFilePath(tokenizer, liquid, parser) {
	if (liquid.options.dynamicPartials) {
		const file = tokenizer.readValue();
		tokenizer.assert(file, "illegal file path");
		if (file.getText() === "none") return;
		if (isQuotedToken(file)) return optimize(parser.parse(evalQuotedToken(file)));
		return file;
	}
	const tokens = [...tokenizer.readFileNameTemplate(liquid.options)];
	const templates = optimize(parser.parseTokens(tokens));
	return templates === "none" ? void 0 : templates;
}
function optimize(templates) {
	if (templates.length === 1 && isHTMLToken(templates[0].token)) return templates[0].token.getContent();
	return templates;
}
function* renderFilePath(file, ctx, liquid) {
	if (typeof file === "string") return file;
	if (Array.isArray(file)) return liquid.renderer.renderTemplates(file, ctx);
	return yield evalToken(file, ctx);
}
var IncludeTag = class extends Tag {
	constructor(token, remainTokens, liquid, parser) {
		super(token, remainTokens, liquid);
		const { tokenizer } = token;
		this["file"] = parseFilePath(tokenizer, this.liquid, parser);
		this["currentFile"] = token.file;
		const begin = tokenizer.p;
		if (tokenizer.readIdentifier().content === "with") {
			tokenizer.skipBlank();
			if (tokenizer.peek() !== ":") this.withVar = tokenizer.readValue();
			else tokenizer.p = begin;
		} else tokenizer.p = begin;
		this.hash = new Hash(tokenizer, liquid.options.jekyllInclude || liquid.options.keyValueSeparator);
	}
	*render(ctx, emitter) {
		const { liquid, hash, withVar } = this;
		const { renderer } = liquid;
		const filepath = yield renderFilePath(this["file"], ctx, liquid);
		assert(filepath, () => `illegal file path "${filepath}"`);
		const saved = ctx.saveRegister("blocks", "blockMode");
		ctx.setRegister("blocks", {});
		ctx.setRegister("blockMode", BlockMode.OUTPUT);
		const scope = yield hash.render(ctx);
		if (withVar) scope[filepath] = yield evalToken(withVar, ctx);
		const templates = yield liquid._parsePartialFile(filepath, ctx.sync, this["currentFile"]);
		ctx.push(ctx.opts.jekyllInclude ? { include: scope } : scope);
		yield renderer.renderTemplates(templates, ctx, emitter);
		ctx.pop();
		ctx.restoreRegister(saved);
	}
	*children(partials, sync) {
		if (partials && isString(this["file"])) return yield this.liquid._parsePartialFile(this["file"], sync, this["currentFile"]);
		return [];
	}
	partialScope() {
		if (isString(this["file"])) {
			let names;
			if (this.liquid.options.jekyllInclude) names = ["include"];
			else {
				names = Object.keys(this.hash.hash);
				if (this.withVar) names.push([this["file"], this.withVar]);
			}
			return {
				name: this["file"],
				isolated: false,
				scope: names
			};
		}
	}
	*arguments() {
		yield* Object.values(this.hash.hash).filter(isValueToken);
		if (isValueToken(this["file"])) yield this["file"];
		if (isValueToken(this.withVar)) yield this.withVar;
	}
};
var DecrementTag = class extends Tag {
	constructor(token, remainTokens, liquid) {
		super(token, remainTokens, liquid);
		this.identifier = this.tokenizer.readIdentifier();
		this.variable = this.identifier.content;
	}
	render(context, emitter) {
		const scope = context.environments;
		if (!isNumber(scope[this.variable])) scope[this.variable] = 0;
		emitter.write(stringify(--scope[this.variable]));
	}
	*localScope() {
		yield this.identifier;
	}
};
var CycleTag = class extends Tag {
	constructor(token, remainTokens, liquid) {
		super(token, remainTokens, liquid);
		this.candidates = [];
		const group = this.tokenizer.readValue();
		this.tokenizer.skipBlank();
		if (group) if (this.tokenizer.peek() === ":") {
			this.group = group;
			this.tokenizer.advance();
		} else this.candidates.push(group);
		while (!this.tokenizer.end()) {
			const value = this.tokenizer.readValue();
			if (value) this.candidates.push(value);
			this.tokenizer.readTo(",");
		}
		this.tokenizer.assert(this.candidates.length, () => `empty candidates: "${token.getText()}"`);
	}
	*render(ctx, emitter) {
		const fingerprint = `cycle:${yield evalToken(this.group, ctx)}:` + this.candidates.join(",");
		const groups = ctx.getRegister("cycle");
		let idx = groups[fingerprint];
		if (idx === void 0) idx = groups[fingerprint] = 0;
		const candidate = this.candidates[idx];
		idx = (idx + 1) % this.candidates.length;
		groups[fingerprint] = idx;
		return yield evalToken(candidate, ctx);
	}
	*arguments() {
		yield* this.candidates;
		if (this.group) yield this.group;
	}
};
var IfTag = class extends Tag {
	constructor(tagToken, remainTokens, liquid, parser) {
		super(tagToken, remainTokens, liquid);
		this.branches = [];
		let p = [];
		parser.parseStream(remainTokens).on("start", () => this.branches.push({
			value: new Value(tagToken.tokenizer.readFilteredValue(), this.liquid),
			templates: p = []
		})).on("tag:elsif", (token) => {
			assert(!this.elseTemplates, "unexpected elsif after else");
			this.branches.push({
				value: new Value(token.tokenizer.readFilteredValue(), this.liquid),
				templates: p = []
			});
		}).on("tag:else", (tag) => {
			assertEmpty(tag.args);
			assert(!this.elseTemplates, "duplicated else");
			p = this.elseTemplates = [];
		}).on("tag:endif", function(tag) {
			assertEmpty(tag.args);
			this.stop();
		}).on("template", (tpl) => p.push(tpl)).on("end", () => {
			throw new Error(`tag ${tagToken.getText()} not closed`);
		}).start();
	}
	*render(ctx, emitter) {
		const r = this.liquid.renderer;
		for (const { value, templates } of this.branches) if (isTruthy(yield value.value(ctx, ctx.opts.lenientIf), ctx)) {
			yield r.renderTemplates(templates, ctx, emitter);
			return;
		}
		yield r.renderTemplates(this.elseTemplates || [], ctx, emitter);
	}
	*children() {
		const templates = this.branches.flatMap((b) => b.templates);
		if (this.elseTemplates) templates.push(...this.elseTemplates);
		return templates;
	}
	arguments() {
		return this.branches.map((b) => b.value);
	}
};
var IncrementTag = class extends Tag {
	constructor(token, remainTokens, liquid) {
		super(token, remainTokens, liquid);
		this.identifier = this.tokenizer.readIdentifier();
		this.variable = this.identifier.content;
	}
	render(context, emitter) {
		const scope = context.environments;
		if (!isNumber(scope[this.variable])) scope[this.variable] = 0;
		const val = scope[this.variable];
		scope[this.variable]++;
		emitter.write(stringify(val));
	}
	*localScope() {
		yield this.identifier;
	}
};
var LayoutTag = class extends Tag {
	constructor(token, remainTokens, liquid, parser) {
		super(token, remainTokens, liquid);
		this.file = parseFilePath(this.tokenizer, this.liquid, parser);
		this["currentFile"] = token.file;
		this.args = new Hash(this.tokenizer, liquid.options.keyValueSeparator);
		this.templates = parser.parseTokens(remainTokens);
	}
	*render(ctx, emitter) {
		const { liquid, args, file } = this;
		const { renderer } = liquid;
		if (file === void 0) {
			ctx.setRegister("blockMode", BlockMode.OUTPUT);
			yield renderer.renderTemplates(this.templates, ctx, emitter);
			return;
		}
		const filepath = yield renderFilePath(this.file, ctx, liquid);
		assert(filepath, () => `illegal file path "${filepath}"`);
		const templates = yield liquid._parseLayoutFile(filepath, ctx.sync, this["currentFile"]);
		ctx.setRegister("blockMode", BlockMode.STORE);
		const html = yield renderer.renderTemplates(this.templates, ctx);
		const blocks = ctx.getRegister("blocks");
		if (blocks[""] === void 0) blocks[""] = (parent, emitter$1) => emitter$1.write(html);
		ctx.setRegister("blockMode", BlockMode.OUTPUT);
		ctx.push(yield args.render(ctx));
		yield renderer.renderTemplates(templates, ctx, emitter);
		ctx.pop();
	}
	*children(partials) {
		const templates = this.templates.slice();
		if (partials && isString(this.file)) templates.push(...yield this.liquid._parsePartialFile(this.file, true, this["currentFile"]));
		return templates;
	}
	*arguments() {
		for (const v of Object.values(this.args.hash)) if (isValueToken(v)) yield v;
		if (isValueToken(this.file)) yield this.file;
	}
	partialScope() {
		if (isString(this.file)) return {
			name: this.file,
			isolated: false,
			scope: Object.keys(this.args.hash)
		};
	}
};
var BlockTag = class extends Tag {
	constructor(token, remainTokens, liquid, parser) {
		super(token, remainTokens, liquid);
		this.templates = [];
		const match = /\w+/.exec(token.args);
		this.block = match ? match[0] : "";
		while (remainTokens.length) {
			const token$1 = remainTokens.shift();
			if (isTagToken(token$1) && token$1.name === "endblock") return;
			const template$1 = parser.parseToken(token$1, remainTokens);
			this.templates.push(template$1);
		}
		throw new Error(`tag ${token.getText()} not closed`);
	}
	*render(ctx, emitter) {
		const blockRender = this.getBlockRender(ctx);
		if (ctx.getRegister("blockMode") === BlockMode.STORE) ctx.getRegister("blocks")[this.block] = blockRender;
		else yield blockRender(new BlockDrop(), emitter);
	}
	getBlockRender(ctx) {
		const { liquid, templates } = this;
		const renderChild = ctx.getRegister("blocks")[this.block];
		const renderCurrent = function* (superBlock, emitter) {
			ctx.push({ block: superBlock });
			yield liquid.renderer.renderTemplates(templates, ctx, emitter);
			ctx.pop();
		};
		return renderChild ? (superBlock, emitter) => renderChild(new BlockDrop((emitter$1) => renderCurrent(superBlock, emitter$1)), emitter) : renderCurrent;
	}
	*children() {
		return this.templates;
	}
	blockScope() {
		return ["block"];
	}
};
var RawTag = class extends Tag {
	constructor(tagToken, remainTokens, liquid) {
		super(tagToken, remainTokens, liquid);
		this.tokens = [];
		while (remainTokens.length) {
			const token = remainTokens.shift();
			if (isTagToken(token) && token.name === "endraw") return;
			this.tokens.push(token);
		}
		throw new Error(`tag ${tagToken.getText()} not closed`);
	}
	render() {
		return this.tokens.map((token) => token.getText()).join("");
	}
};
var TablerowloopDrop = class extends ForloopDrop {
	constructor(length, cols, collection, variable) {
		super(length, collection, variable);
		this.length = length;
		this.cols = cols;
	}
	row() {
		return Math.floor(this.i / this.cols) + 1;
	}
	col0() {
		return this.i % this.cols;
	}
	col() {
		return this.col0() + 1;
	}
	col_first() {
		return this.col0() === 0;
	}
	col_last() {
		return this.col() === this.cols;
	}
};
var TablerowTag = class extends Tag {
	constructor(tagToken, remainTokens, liquid, parser) {
		super(tagToken, remainTokens, liquid);
		const variable = this.tokenizer.readIdentifier();
		this.tokenizer.skipBlank();
		const predicate = this.tokenizer.readIdentifier();
		const collectionToken = this.tokenizer.readValue();
		if (predicate.content !== "in" || !collectionToken) throw new Error(`illegal tag: ${tagToken.getText()}`);
		this.variable = variable.content;
		this.collection = collectionToken;
		this.args = new Hash(this.tokenizer, liquid.options.keyValueSeparator);
		this.templates = [];
		let p;
		const stream = parser.parseStream(remainTokens).on("start", () => p = this.templates).on("tag:endtablerow", () => stream.stop()).on("template", (tpl) => p.push(tpl)).on("end", () => {
			throw new Error(`tag ${tagToken.getText()} not closed`);
		});
		stream.start();
	}
	*render(ctx, emitter) {
		let collection = toEnumerable(yield evalToken(this.collection, ctx));
		const args = yield this.args.render(ctx);
		const offset$1 = args.offset || 0;
		const limit$1 = args.limit === void 0 ? collection.length : args.limit;
		collection = collection.slice(offset$1, offset$1 + limit$1);
		const cols = args.cols || collection.length;
		const r = this.liquid.renderer;
		const tablerowloop = new TablerowloopDrop(collection.length, cols, this.collection.getText(), this.variable);
		const scope = { tablerowloop };
		ctx.push(scope);
		for (let idx = 0; idx < collection.length; idx++, tablerowloop.next()) {
			scope[this.variable] = collection[idx];
			if (tablerowloop.col0() === 0) {
				if (tablerowloop.row() !== 1) emitter.write("</tr>");
				emitter.write(`<tr class="row${tablerowloop.row()}">`);
			}
			emitter.write(`<td class="col${tablerowloop.col()}">`);
			yield r.renderTemplates(this.templates, ctx, emitter);
			emitter.write("</td>");
		}
		if (collection.length) emitter.write("</tr>");
		ctx.pop();
	}
	*children() {
		return this.templates;
	}
	*arguments() {
		yield this.collection;
		for (const v of Object.values(this.args.hash)) if (isValueToken(v)) yield v;
	}
	blockScope() {
		return [this.variable, "tablerowloop"];
	}
};
var UnlessTag = class extends Tag {
	constructor(tagToken, remainTokens, liquid, parser) {
		super(tagToken, remainTokens, liquid);
		this.branches = [];
		this.elseTemplates = [];
		let p = [];
		let elseCount = 0;
		parser.parseStream(remainTokens).on("start", () => this.branches.push({
			value: new Value(tagToken.tokenizer.readFilteredValue(), this.liquid),
			test: isFalsy,
			templates: p = []
		})).on("tag:elsif", (token) => {
			if (elseCount > 0) {
				p = [];
				return;
			}
			this.branches.push({
				value: new Value(token.tokenizer.readFilteredValue(), this.liquid),
				test: isTruthy,
				templates: p = []
			});
		}).on("tag:else", () => {
			elseCount++;
			p = this.elseTemplates;
		}).on("tag:endunless", function() {
			this.stop();
		}).on("template", (tpl) => {
			if (p !== this.elseTemplates || elseCount === 1) p.push(tpl);
		}).on("end", () => {
			throw new Error(`tag ${tagToken.getText()} not closed`);
		}).start();
	}
	*render(ctx, emitter) {
		const r = this.liquid.renderer;
		for (const { value, test, templates } of this.branches) if (test(yield value.value(ctx, ctx.opts.lenientIf), ctx)) {
			yield r.renderTemplates(templates, ctx, emitter);
			return;
		}
		yield r.renderTemplates(this.elseTemplates, ctx, emitter);
	}
	*children() {
		const children = this.branches.flatMap((b) => b.templates);
		if (this.elseTemplates) children.push(...this.elseTemplates);
		return children;
	}
	arguments() {
		return this.branches.map((b) => b.value);
	}
};
var BreakTag = class extends Tag {
	render(ctx, _emitter) {
		ctx.breakCalled = true;
	}
};
var ContinueTag = class extends Tag {
	render(ctx, _emitter) {
		ctx.continueCalled = true;
	}
};
var EchoTag = class extends Tag {
	constructor(token, remainTokens, liquid) {
		super(token, remainTokens, liquid);
		this.tokenizer.skipBlank();
		if (!this.tokenizer.end()) this.value = new Value(this.tokenizer.readFilteredValue(), this.liquid);
	}
	*render(ctx, emitter) {
		if (!this.value) return;
		const val = yield this.value.value(ctx, false);
		emitter.write(val);
	}
	*arguments() {
		if (this.value) yield this.value;
	}
};
var LiquidTag = class extends Tag {
	constructor(token, remainTokens, liquid, parser) {
		super(token, remainTokens, liquid);
		const tokens = this.tokenizer.readLiquidTagTokens(this.liquid.options);
		this.templates = parser.parseTokens(tokens);
	}
	*render(ctx, emitter) {
		yield this.liquid.renderer.renderTemplates(this.templates, ctx, emitter);
	}
	*children() {
		return this.templates;
	}
};
var InlineCommentTag = class extends Tag {
	constructor(tagToken, remainTokens, liquid) {
		super(tagToken, remainTokens, liquid);
		if (tagToken.args.search(/\n\s*[^#\s]/g) !== -1) throw new Error("every line of an inline comment must start with a '#' character");
	}
	render() {}
};
var tags = {
	assign: AssignTag,
	"for": ForTag,
	capture: CaptureTag,
	"case": CaseTag,
	comment: CommentTag,
	include: IncludeTag,
	render: RenderTag,
	decrement: DecrementTag,
	increment: IncrementTag,
	cycle: CycleTag,
	"if": IfTag,
	layout: LayoutTag,
	block: BlockTag,
	raw: RawTag,
	tablerow: TablerowTag,
	unless: UnlessTag,
	"break": BreakTag,
	"continue": ContinueTag,
	echo: EchoTag,
	liquid: LiquidTag,
	"#": InlineCommentTag
};
var Liquid = class Liquid {
	constructor(opts = {}) {
		this.renderer = new Render();
		this.filters = {};
		this.tags = {};
		this.options = normalize(opts);
		this.parser = new Parser$1(this);
		forOwn(tags, (conf, name) => this.registerTag(name, conf));
		forOwn(filters, (handler, name) => this.registerFilter(name, handler));
	}
	parse(html, filepath) {
		return new Parser$1(this).parse(html, filepath);
	}
	_render(tpl, scope, renderOptions) {
		const ctx = scope instanceof Context ? scope : new Context(scope, this.options, renderOptions);
		return this.renderer.renderTemplates(tpl, ctx);
	}
	render(tpl, scope, renderOptions) {
		return __awaiter(this, void 0, void 0, function* () {
			return toPromise(this._render(tpl, scope, Object.assign(Object.assign({}, renderOptions), { sync: false })));
		});
	}
	renderSync(tpl, scope, renderOptions) {
		return toValueSync(this._render(tpl, scope, Object.assign(Object.assign({}, renderOptions), { sync: true })));
	}
	renderToNodeStream(tpl, scope, renderOptions = {}) {
		const ctx = new Context(scope, this.options, renderOptions);
		return this.renderer.renderTemplatesToNodeStream(tpl, ctx);
	}
	_parseAndRender(html, scope, renderOptions) {
		const tpl = this.parse(html);
		return this._render(tpl, scope, renderOptions);
	}
	parseAndRender(html, scope, renderOptions) {
		return __awaiter(this, void 0, void 0, function* () {
			return toPromise(this._parseAndRender(html, scope, Object.assign(Object.assign({}, renderOptions), { sync: false })));
		});
	}
	parseAndRenderSync(html, scope, renderOptions) {
		return toValueSync(this._parseAndRender(html, scope, Object.assign(Object.assign({}, renderOptions), { sync: true })));
	}
	_parsePartialFile(file, sync, currentFile) {
		return new Parser$1(this).parseFile(file, sync, LookupType.Partials, currentFile);
	}
	_parseLayoutFile(file, sync, currentFile) {
		return new Parser$1(this).parseFile(file, sync, LookupType.Layouts, currentFile);
	}
	_parseFile(file, sync, lookupType, currentFile) {
		return new Parser$1(this).parseFile(file, sync, lookupType, currentFile);
	}
	parseFile(file, lookupType) {
		return __awaiter(this, void 0, void 0, function* () {
			return toPromise(new Parser$1(this).parseFile(file, false, lookupType));
		});
	}
	parseFileSync(file, lookupType) {
		return toValueSync(new Parser$1(this).parseFile(file, true, lookupType));
	}
	*_renderFile(file, ctx, renderFileOptions) {
		const templates = yield this._parseFile(file, renderFileOptions.sync, renderFileOptions.lookupType);
		return yield this._render(templates, ctx, renderFileOptions);
	}
	renderFile(file, ctx, renderFileOptions) {
		return __awaiter(this, void 0, void 0, function* () {
			return toPromise(this._renderFile(file, ctx, Object.assign(Object.assign({}, renderFileOptions), { sync: false })));
		});
	}
	renderFileSync(file, ctx, renderFileOptions) {
		return toValueSync(this._renderFile(file, ctx, Object.assign(Object.assign({}, renderFileOptions), { sync: true })));
	}
	renderFileToNodeStream(file, scope, renderOptions) {
		return __awaiter(this, void 0, void 0, function* () {
			const templates = yield this.parseFile(file);
			return this.renderToNodeStream(templates, scope, renderOptions);
		});
	}
	_evalValue(str, scope) {
		const value = new Value(str, this);
		const ctx = scope instanceof Context ? scope : new Context(scope, this.options);
		return value.value(ctx);
	}
	evalValue(str, scope) {
		return __awaiter(this, void 0, void 0, function* () {
			return toPromise(this._evalValue(str, scope));
		});
	}
	evalValueSync(str, scope) {
		return toValueSync(this._evalValue(str, scope));
	}
	registerFilter(name, filter$1) {
		this.filters[name] = filter$1;
	}
	registerTag(name, tag) {
		this.tags[name] = isFunction(tag) ? tag : createTagClass(tag);
	}
	plugin(plugin) {
		return plugin.call(this, Liquid);
	}
	express() {
		const self = this;
		let firstCall = true;
		return function(filePath, ctx, callback) {
			if (firstCall) {
				firstCall = false;
				const dirs = normalizeDirectoryList(this.root);
				self.options.root.unshift(...dirs);
				self.options.layouts.unshift(...dirs);
				self.options.partials.unshift(...dirs);
			}
			self.renderFile(filePath, ctx).then((html) => callback(null, html), callback);
		};
	}
	analyze(template$1, options = {}) {
		return __awaiter(this, void 0, void 0, function* () {
			return analyze(template$1, options);
		});
	}
	analyzeSync(template$1, options = {}) {
		return analyzeSync(template$1, options);
	}
	parseAndAnalyze(html, filename, options = {}) {
		return __awaiter(this, void 0, void 0, function* () {
			return analyze(this.parse(html, filename), options);
		});
	}
	parseAndAnalyzeSync(html, filename, options = {}) {
		return analyzeSync(this.parse(html, filename), options);
	}
	variables(template$1, options = {}) {
		return __awaiter(this, void 0, void 0, function* () {
			const analysis = yield analyze(isString(template$1) ? this.parse(template$1) : template$1, options);
			return Object.keys(analysis.variables);
		});
	}
	variablesSync(template$1, options = {}) {
		const analysis = analyzeSync(isString(template$1) ? this.parse(template$1) : template$1, options);
		return Object.keys(analysis.variables);
	}
	fullVariables(template$1, options = {}) {
		return __awaiter(this, void 0, void 0, function* () {
			const analysis = yield analyze(isString(template$1) ? this.parse(template$1) : template$1, options);
			return Array.from(new Set(Object.values(analysis.variables).flatMap((a) => a.map((v) => String(v)))));
		});
	}
	fullVariablesSync(template$1, options = {}) {
		const analysis = analyzeSync(isString(template$1) ? this.parse(template$1) : template$1, options);
		return Array.from(new Set(Object.values(analysis.variables).flatMap((a) => a.map((v) => String(v)))));
	}
	variableSegments(template$1, options = {}) {
		return __awaiter(this, void 0, void 0, function* () {
			const analysis = yield analyze(isString(template$1) ? this.parse(template$1) : template$1, options);
			return Array.from(strictUniq(Object.values(analysis.variables).flatMap((a) => a.map((v) => v.toArray()))));
		});
	}
	variableSegmentsSync(template$1, options = {}) {
		const analysis = analyzeSync(isString(template$1) ? this.parse(template$1) : template$1, options);
		return Array.from(strictUniq(Object.values(analysis.variables).flatMap((a) => a.map((v) => v.toArray()))));
	}
	globalVariables(template$1, options = {}) {
		return __awaiter(this, void 0, void 0, function* () {
			const analysis = yield analyze(isString(template$1) ? this.parse(template$1) : template$1, options);
			return Object.keys(analysis.globals);
		});
	}
	globalVariablesSync(template$1, options = {}) {
		const analysis = analyzeSync(isString(template$1) ? this.parse(template$1) : template$1, options);
		return Object.keys(analysis.globals);
	}
	globalFullVariables(template$1, options = {}) {
		return __awaiter(this, void 0, void 0, function* () {
			const analysis = yield analyze(isString(template$1) ? this.parse(template$1) : template$1, options);
			return Array.from(new Set(Object.values(analysis.globals).flatMap((a) => a.map((v) => String(v)))));
		});
	}
	globalFullVariablesSync(template$1, options = {}) {
		const analysis = analyzeSync(isString(template$1) ? this.parse(template$1) : template$1, options);
		return Array.from(new Set(Object.values(analysis.globals).flatMap((a) => a.map((v) => String(v)))));
	}
	globalVariableSegments(template$1, options = {}) {
		return __awaiter(this, void 0, void 0, function* () {
			const analysis = yield analyze(isString(template$1) ? this.parse(template$1) : template$1, options);
			return Array.from(strictUniq(Object.values(analysis.globals).flatMap((a) => a.map((v) => v.toArray()))));
		});
	}
	globalVariableSegmentsSync(template$1, options = {}) {
		const analysis = analyzeSync(isString(template$1) ? this.parse(template$1) : template$1, options);
		return Array.from(strictUniq(Object.values(analysis.globals).flatMap((a) => a.map((v) => v.toArray()))));
	}
};
var LiquidTemplateEngine = class extends BaseTemplateEngine {
	constructor() {
		super();
		this.name = "liquid";
		this.compiledTemplates = /* @__PURE__ */ new Map();
		this.liquid = new Liquid({
			cache: true,
			strictFilters: false,
			strictVariables: false,
			trimTagLeft: false,
			trimTagRight: false,
			trimOutputLeft: false,
			trimOutputRight: false
		});
		this.registerDefaultFilters();
	}
	async render(template$1, context) {
		try {
			let compiledTemplate = this.compiledTemplates.get(template$1);
			if (!compiledTemplate) {
				compiledTemplate = this.liquid.parse(template$1);
				this.compiledTemplates.set(template$1, compiledTemplate);
			}
			return await this.liquid.render(compiledTemplate, context);
		} catch (error) {
			throw new Error(`Liquid render error: ${error instanceof Error ? error.message : String(error)}`);
		}
	}
	async validate(template$1) {
		try {
			this.liquid.parse(template$1);
			return { valid: true };
		} catch (error) {
			return {
				valid: false,
				errors: [error instanceof Error ? error.message : String(error)]
			};
		}
	}
	async compile(template$1) {
		const compiled = this.liquid.parse(template$1);
		this.compiledTemplates.set(template$1, compiled);
		return compiled;
	}
	registerHelper(name, fn) {
		this.liquid.registerFilter(name, fn);
	}
	registerDefaultFilters() {
		this.liquid.registerFilter("money", (value) => {
			const num = parseFloat(value);
			if (isNaN(num)) return value;
			return `$${num.toFixed(2)}`;
		});
		this.liquid.registerFilter("money_with_currency", (value, currency = "USD") => {
			const num = parseFloat(value);
			if (isNaN(num)) return value;
			return new Intl.NumberFormat("en-US", {
				style: "currency",
				currency
			}).format(num);
		});
		this.liquid.registerFilter("phone", (value) => {
			const cleaned = value.replace(/\D/g, "");
			if (cleaned.length === 10) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
			return value;
		});
		this.liquid.registerFilter("pluralize", (count, singular, plural) => {
			if (count === 1) return singular;
			return plural || `${singular}s`;
		});
		this.liquid.registerFilter("default", (value, defaultValue) => {
			return value ?? defaultValue;
		});
		this.liquid.registerFilter("json", (obj) => {
			try {
				return JSON.stringify(obj, null, 2);
			} catch {
				return String(obj);
			}
		});
		this.liquid.registerFilter("excerpt", (text, length = 200) => {
			if (typeof text !== "string") return text;
			if (text.length <= length) return text;
			return text.substring(0, length).trim() + "...";
		});
		this.liquid.registerFilter("strip_html", (text) => {
			if (typeof text !== "string") return text;
			return text.replace(/<[^>]*>/g, "");
		});
		this.liquid.registerFilter("highlight", (text, term) => {
			if (!text || !term) return text;
			const regex = new RegExp(`(${term})`, "gi");
			return text.replace(regex, "<mark>$1</mark>");
		});
		this.liquid.registerFilter("file_size", (bytes) => {
			if (bytes === 0) return "0 Bytes";
			const k = 1024;
			const sizes = [
				"Bytes",
				"KB",
				"MB",
				"GB"
			];
			const i = Math.floor(Math.log(bytes) / Math.log(k));
			return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
		});
		this.liquid.registerFilter("time_ago", (date$1) => {
			const d = date$1 instanceof Date ? date$1 : new Date(date$1);
			const now = /* @__PURE__ */ new Date();
			const seconds = Math.floor((now.getTime() - d.getTime()) / 1e3);
			for (const interval of [
				{
					label: "year",
					seconds: 31536e3
				},
				{
					label: "month",
					seconds: 2592e3
				},
				{
					label: "week",
					seconds: 604800
				},
				{
					label: "day",
					seconds: 86400
				},
				{
					label: "hour",
					seconds: 3600
				},
				{
					label: "minute",
					seconds: 60
				},
				{
					label: "second",
					seconds: 1
				}
			]) {
				const count = Math.floor(seconds / interval.seconds);
				if (count >= 1) return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
			}
			return "just now";
		});
	}
	clearCache() {
		this.compiledTemplates.clear();
	}
};
var mjml2html = null;
var mjmlLoadAttempted = false;
var MJMLTemplateEngine = class extends BaseTemplateEngine {
	constructor() {
		super();
		this.name = "mjml";
		this.handlebars = new HandlebarsTemplateEngine();
	}
	async loadMjml() {
		if (mjmlLoadAttempted) {
			if (!mjml2html) throw new Error("MJML template engine is not available in this environment. This is typically a test environment limitation due to Node.js dependencies. MJML works fine in production Cloudflare Workers.");
			return;
		}
		mjmlLoadAttempted = true;
		try {
			mjml2html = (await import("./lib-Dz6lV0oJ.js").then(__toDynamicImportESM(1))).default;
		} catch (error) {
			mjml2html = null;
			throw new Error("MJML template engine is not available in this environment. This is typically a test environment limitation due to Node.js dependencies. MJML works fine in production Cloudflare Workers.");
		}
	}
	async render(template$1, context) {
		await this.loadMjml();
		try {
			const mjmlWithData = await this.handlebars.render(template$1, context);
			const result = mjml2html(mjmlWithData, {
				validationLevel: "soft",
				minify: false,
				beautify: true
			});
			if (result.errors && result.errors.length > 0) {
				const errorMessages = result.errors.map((e) => e.formattedMessage || e.message).join(", ");
				throw new Error(`MJML compilation errors: ${errorMessages}`);
			}
			return result.html;
		} catch (error) {
			throw new Error(`MJML render error: ${error instanceof Error ? error.message : String(error)}`);
		}
	}
	async validate(template$1) {
		try {
			await this.loadMjml();
			const handlebarsValidation = await this.handlebars.validate(template$1);
			if (!handlebarsValidation.valid) return handlebarsValidation;
			const testContext = this.createDummyContext(template$1);
			const mjmlWithData = await this.handlebars.render(template$1, testContext);
			const result = mjml2html(mjmlWithData, { validationLevel: "strict" });
			if (result.errors && result.errors.length > 0) return {
				valid: false,
				errors: result.errors.map((e) => e.formattedMessage || e.message)
			};
			return { valid: true };
		} catch (error) {
			return {
				valid: false,
				errors: [error instanceof Error ? error.message : String(error)]
			};
		}
	}
	registerHelper(name, fn) {
		this.handlebars.registerHelper(name, fn);
	}
	registerPartial(name, template$1) {
		this.handlebars.registerPartial(name, template$1);
	}
	createDummyContext(template$1) {
		const context = {};
		const varRegex = /\{\{([^}#/]+)\}\}/g;
		let match;
		while ((match = varRegex.exec(template$1)) !== null) {
			const varName = match[1].trim();
			if (!varName.startsWith("#") && !varName.startsWith("/") && !varName.startsWith("!")) {
				const parts = varName.split(".");
				let current = context;
				for (let i = 0; i < parts.length; i++) {
					const part = parts[i];
					if (i === parts.length - 1) current[part] = "test";
					else {
						current[part] = current[part] || {};
						current = current[part];
					}
				}
			}
		}
		return context;
	}
	clearCache() {
		this.handlebars.clearCache();
	}
};
function createTemplateEngine(engine) {
	switch (engine) {
		case "simple": return new SimpleTemplateEngine();
		case "handlebars": return new HandlebarsTemplateEngine();
		case "liquid": return new LiquidTemplateEngine();
		case "mjml": return new MJMLTemplateEngine();
		default: throw new Error(`Unknown template engine: ${engine}`);
	}
}
var TemplateLoader = class {
	constructor(config) {
		this.engine = config.engine;
		this.kv = config.kv;
		this.localDir = config.localDir || "templates";
		this.defaultVersion = config.defaultVersion || "latest";
		this.cache = /* @__PURE__ */ new Map();
	}
	async render(template$1, data = {}, env) {
		const resolved = await resolveValue(template$1, {
			env,
			baseDir: process.cwd()
		});
		const content = typeof resolved.content === "string" ? resolved.content : JSON.stringify(resolved.content);
		return await this.engine.render(content, data);
	}
	parseTemplateRef(template$1) {
		if (template$1.startsWith("kv://")) {
			const [pathPart, version] = template$1.slice(5).split("@");
			return {
				type: "kv",
				path: pathPart,
				version: version || this.defaultVersion
			};
		}
		if ((template$1.endsWith(".html") || template$1.endsWith(".mjml")) && !template$1.includes("<")) return {
			type: "local",
			path: template$1
		};
		return {
			type: "inline",
			path: template$1
		};
	}
	async loadTemplate(ref) {
		const cacheKey = `${ref.type}:${ref.path}${ref.version ? `@${ref.version}` : ""}`;
		if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);
		let content;
		switch (ref.type) {
			case "kv":
				content = await this.loadFromKv(ref.path, ref.version);
				break;
			case "local":
				content = await this.loadFromLocal(ref.path);
				break;
			case "inline":
				content = ref.path;
				break;
		}
		this.cache.set(cacheKey, content);
		return content;
	}
	async loadFromKv(path$1, version) {
		if (!this.kv) throw new Error("KV namespace not configured for template loading");
		const key = version ? `${path$1}@${version}` : path$1;
		const content = await this.kv.get(key, "text");
		if (!content) throw new Error(`Template not found in KV: ${key}`);
		return content;
	}
	async loadFromLocal(path$1) {
		throw new Error("Local file system access not available in Cloudflare Workers. Use KV storage (kv://...) or inline templates instead.");
	}
	clearCache() {
		this.cache.clear();
	}
	async preload(template$1) {
		const ref = this.parseTemplateRef(template$1);
		await this.loadTemplate(ref);
	}
};
init_base_agent();
var EmailAgent = class extends BaseAgent {
	constructor(config) {
		super(config);
		const emailConfig = config.config;
		if (!emailConfig?.provider) throw new Error("Email agent requires provider configuration");
		this.provider = createEmailProvider(emailConfig.provider);
		this.templateEngine = createTemplateEngine(emailConfig.templateEngine || "simple");
		this.templateLoader = new TemplateLoader({
			engine: this.templateEngine,
			kv: emailConfig.templatesKv ? config.env?.[emailConfig.templatesKv] || void 0 : void 0,
			defaultVersion: "latest"
		});
		this.rateLimit = emailConfig.rateLimit || 10;
		this.tracking = emailConfig.tracking ?? false;
	}
	async run(context) {
		const input = context.input;
		if ("recipients" in input && Array.isArray(input.recipients)) return this.sendBatch(input, context);
		return this.sendSingle(input, context);
	}
	async sendSingle(input, context) {
		const message = await this.buildMessage(input, context);
		const validation = await this.provider.validateConfig();
		if (!validation.valid) throw new Error(`Provider validation failed: ${validation.errors?.join(", ")}`);
		const result = await this.provider.send(message);
		if (result.status === "failed") throw new Error(`Email send failed: ${result.error}`);
		return {
			messageId: result.messageId,
			status: result.status,
			provider: result.provider,
			timestamp: (/* @__PURE__ */ new Date()).toISOString()
		};
	}
	async sendBatch(input, context) {
		const results = [];
		const errors = [];
		const messageIds = [];
		const delayMs = 1e3 / this.rateLimit;
		let lastSendTime = 0;
		for (const recipient of input.recipients) try {
			const timeSinceLastSend = Date.now() - lastSendTime;
			if (timeSinceLastSend < delayMs) await this.delay(delayMs - timeSinceLastSend);
			lastSendTime = Date.now();
			const emailInput = {
				to: recipient.email,
				subject: input.subject,
				template: input.template,
				data: {
					...input.commonData,
					...recipient.data
				}
			};
			const message = await this.buildMessage(emailInput, context);
			const result = await this.provider.send(message);
			results.push(result);
			if (result.status === "sent") messageIds.push(result.messageId);
			else errors.push({
				email: recipient.email,
				error: result.error || "Unknown error"
			});
		} catch (error) {
			errors.push({
				email: recipient.email,
				error: error instanceof Error ? error.message : "Unknown error"
			});
		}
		const sent = results.filter((r) => r.status === "sent").length;
		return {
			sent,
			failed: results.length - sent,
			messageIds,
			errors: errors.length > 0 ? errors : void 0
		};
	}
	async buildMessage(input, context) {
		let html = input.html;
		let text = input.text;
		if (input.template) {
			const data = input.data || {};
			html = await this.templateLoader.render(input.template, data, context.env);
			if (!text) text = this.stripHtml(html);
		}
		const message = {
			to: input.to,
			cc: input.cc,
			bcc: input.bcc,
			from: input.from,
			replyTo: input.replyTo,
			subject: input.subject,
			html,
			text,
			attachments: input.attachments,
			headers: input.headers,
			tags: input.tags,
			metadata: input.metadata
		};
		if (this.tracking) message.headers = {
			...message.headers,
			"X-Conductor-Tracking": "enabled",
			"X-Conductor-Ensemble": context.state?.ensembleName || "unknown"
		};
		return message;
	}
	stripHtml(html) {
		return html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
	}
	delay(ms) {
		return new Promise((resolve$2) => setTimeout(resolve$2, ms));
	}
};
var BaseSmsProvider = class {
	normalizeRecipients(recipients) {
		return Array.isArray(recipients) ? recipients : [recipients];
	}
	validatePhoneNumber(phone) {
		return /^\+[1-9]\d{1,14}$/.test(phone);
	}
	validateMessage(message) {
		const errors = [];
		if (!message.to || Array.isArray(message.to) && message.to.length === 0) errors.push("Recipient (to) is required");
		if (!message.body || message.body.trim() === "") errors.push("Message body is required");
		const recipients = this.normalizeRecipients(message.to);
		for (const phone of recipients) if (!this.validatePhoneNumber(phone)) errors.push(`Invalid phone number format: ${phone} (must be E.164 format, e.g., +1234567890)`);
		if (message.body.length > 1600) errors.push("Message body exceeds maximum length of 1600 characters");
		return {
			valid: errors.length === 0,
			errors: errors.length > 0 ? errors : void 0
		};
	}
};
var TwilioProvider = class extends BaseSmsProvider {
	constructor(accountSid, authToken, defaultFrom, messagingServiceSid) {
		super();
		this.accountSid = accountSid;
		this.authToken = authToken;
		this.defaultFrom = defaultFrom;
		this.messagingServiceSid = messagingServiceSid;
		this.name = "twilio";
		this.apiUrl = "https://api.twilio.com/2010-04-01";
	}
	async send(message) {
		const validation = this.validateMessage(message);
		if (!validation.valid) return {
			messageId: "",
			status: "failed",
			provider: this.name,
			error: validation.errors?.join(", ")
		};
		try {
			const recipients = this.normalizeRecipients(message.to);
			if (recipients.length === 1) return await this.sendSingle(message, recipients[0]);
			const results = [];
			for (const recipient of recipients) {
				const result = await this.sendSingle({
					...message,
					to: recipient
				}, recipient);
				results.push(result);
			}
			return results[0];
		} catch (error) {
			return {
				messageId: "",
				status: "failed",
				provider: this.name,
				error: error instanceof Error ? error.message : "Unknown error"
			};
		}
	}
	async sendSingle(message, recipient) {
		const body = new URLSearchParams();
		body.append("To", recipient);
		body.append("Body", message.body);
		if (this.messagingServiceSid) body.append("MessagingServiceSid", this.messagingServiceSid);
		else body.append("From", message.from || this.defaultFrom);
		if (message.mediaUrl && message.mediaUrl.length > 0) message.mediaUrl.forEach((url$1) => {
			body.append("MediaUrl", url$1);
		});
		if (message.metadata?.statusCallback) body.append("StatusCallback", message.metadata.statusCallback);
		const url = `${this.apiUrl}/Accounts/${this.accountSid}/Messages.json`;
		const auth = btoa(`${this.accountSid}:${this.authToken}`);
		const response = await fetch(url, {
			method: "POST",
			headers: {
				Authorization: `Basic ${auth}`,
				"Content-Type": "application/x-www-form-urlencoded"
			},
			body: body.toString()
		});
		const data = await response.json();
		if (!response.ok) return {
			messageId: "",
			status: "failed",
			provider: this.name,
			error: data?.message || `HTTP ${response.status}`
		};
		return {
			messageId: data.sid,
			status: this.mapTwilioStatus(data.status),
			provider: this.name
		};
	}
	mapTwilioStatus(twilioStatus) {
		switch (twilioStatus) {
			case "sent":
			case "delivered": return "sent";
			case "queued":
			case "accepted":
			case "sending": return "queued";
			case "failed":
			case "undelivered":
			default: return "failed";
		}
	}
	async validateConfig() {
		const errors = [];
		if (!this.accountSid) errors.push("Twilio Account SID is required");
		if (!this.authToken) errors.push("Twilio Auth Token is required");
		if (!this.messagingServiceSid && !this.defaultFrom) errors.push("Either Twilio Messaging Service SID or default from number is required");
		if (this.defaultFrom && !this.validatePhoneNumber(this.defaultFrom)) errors.push("Default from number must be in E.164 format (e.g., +1234567890)");
		return {
			valid: errors.length === 0,
			errors: errors.length > 0 ? errors : void 0
		};
	}
};
function createSmsProvider(config) {
	const from = config.from || "";
	switch (config.provider) {
		case "twilio":
			if (!config.twilio) throw new Error("Twilio configuration is required");
			if (!config.twilio.accountSid) throw new Error("Twilio Account SID is required");
			if (!config.twilio.authToken) throw new Error("Twilio Auth Token is required");
			return new TwilioProvider(config.twilio.accountSid, config.twilio.authToken, from, config.twilio.messagingServiceSid);
		default: throw new Error(`Unknown SMS provider: ${config.provider}`);
	}
}
init_base_agent();
var SmsMember = class extends BaseAgent {
	constructor(config) {
		super(config);
		const smsConfig = config.config;
		if (!smsConfig?.provider) throw new Error("SMS agent requires provider configuration");
		this.provider = createSmsProvider(smsConfig.provider);
		this.templateEngine = createTemplateEngine(smsConfig.templateEngine || "simple");
		this.rateLimit = smsConfig.rateLimit || 10;
	}
	async run(context) {
		const input = context.input;
		if ("recipients" in input && Array.isArray(input.recipients)) return this.sendBatch(input, context);
		return this.sendSingle(input, context);
	}
	async sendSingle(input, context) {
		const message = this.buildMessage(input);
		const validation = await this.provider.validateConfig();
		if (!validation.valid) throw new Error(`Provider validation failed: ${validation.errors?.join(", ")}`);
		const result = await this.provider.send(message);
		if (result.status === "failed") throw new Error(`SMS send failed: ${result.error}`);
		return {
			messageId: result.messageId,
			status: result.status,
			provider: result.provider,
			timestamp: (/* @__PURE__ */ new Date()).toISOString()
		};
	}
	async sendBatch(input, context) {
		const results = [];
		const errors = [];
		const messageIds = [];
		const delayMs = 1e3 / this.rateLimit;
		let lastSendTime = 0;
		for (const recipient of input.recipients) try {
			const timeSinceLastSend = Date.now() - lastSendTime;
			if (timeSinceLastSend < delayMs) await this.delay(delayMs - timeSinceLastSend);
			lastSendTime = Date.now();
			const body = await this.renderTemplate(input.body, {
				...input.commonData,
				...recipient.data
			});
			const smsInput = {
				to: recipient.phone,
				body,
				mediaUrl: input.mediaUrl
			};
			const message = this.buildMessage(smsInput);
			const result = await this.provider.send(message);
			results.push(result);
			if (result.status === "sent" || result.status === "queued") messageIds.push(result.messageId);
			else errors.push({
				phone: recipient.phone,
				error: result.error || "Unknown error"
			});
		} catch (error) {
			errors.push({
				phone: recipient.phone,
				error: error instanceof Error ? error.message : "Unknown error"
			});
		}
		const sent = results.filter((r) => r.status === "sent" || r.status === "queued").length;
		return {
			sent,
			failed: results.length - sent,
			messageIds,
			errors: errors.length > 0 ? errors : void 0
		};
	}
	buildMessage(input) {
		return {
			to: input.to,
			from: input.from,
			body: input.body,
			mediaUrl: input.mediaUrl,
			metadata: input.metadata
		};
	}
	async renderTemplate(template$1, data) {
		return await this.templateEngine.render(template$1, data);
	}
	delay(ms) {
		return new Promise((resolve$2) => setTimeout(resolve$2, ms));
	}
};
async function validateField(field, value, allData, context) {
	const errors = [];
	if (field.disabled || field.readonly) return errors;
	const validation = field.validation;
	if (!validation) return errors;
	if (validation.required) {
		if (isEmpty(value)) {
			const message = typeof validation.required === "string" ? validation.required : `${field.label || field.name} is required`;
			errors.push({
				field: field.name,
				message,
				rule: "required"
			});
			return errors;
		}
	}
	if (isEmpty(value)) return errors;
	const stringValue = String(value);
	if (validation.email) {
		if (!isValidEmail(stringValue)) {
			const message = typeof validation.email === "string" ? validation.email : "Please enter a valid email address";
			errors.push({
				field: field.name,
				message,
				rule: "email"
			});
		}
	}
	if (validation.url) {
		if (!isValidUrl(stringValue)) {
			const message = typeof validation.url === "string" ? validation.url : "Please enter a valid URL";
			errors.push({
				field: field.name,
				message,
				rule: "url"
			});
		}
	}
	if (validation.pattern) {
		const pattern = typeof validation.pattern === "string" ? {
			regex: validation.pattern,
			message: "Invalid format"
		} : validation.pattern;
		if (!new RegExp(pattern.regex).test(stringValue)) errors.push({
			field: field.name,
			message: pattern.message,
			rule: "pattern"
		});
	}
	if (field.type === "number" && typeof value === "number") {
		if (validation.min !== void 0) {
			const min = typeof validation.min === "number" ? {
				value: validation.min,
				message: `Minimum value is ${validation.min}`
			} : validation.min;
			if (value < min.value) errors.push({
				field: field.name,
				message: min.message,
				rule: "min"
			});
		}
		if (validation.max !== void 0) {
			const max = typeof validation.max === "number" ? {
				value: validation.max,
				message: `Maximum value is ${validation.max}`
			} : validation.max;
			if (value > max.value) errors.push({
				field: field.name,
				message: max.message,
				rule: "max"
			});
		}
	}
	if (validation.minLength !== void 0) {
		const minLength = typeof validation.minLength === "number" ? {
			value: validation.minLength,
			message: `Minimum length is ${validation.minLength}`
		} : validation.minLength;
		if (stringValue.length < minLength.value) errors.push({
			field: field.name,
			message: minLength.message,
			rule: "minLength"
		});
	}
	if (validation.maxLength !== void 0) {
		const maxLength = typeof validation.maxLength === "number" ? {
			value: validation.maxLength,
			message: `Maximum length is ${validation.maxLength}`
		} : validation.maxLength;
		if (stringValue.length > maxLength.value) errors.push({
			field: field.name,
			message: maxLength.message,
			rule: "maxLength"
		});
	}
	if (validation.matches) {
		const matches = typeof validation.matches === "string" ? {
			field: validation.matches,
			message: "Fields do not match"
		} : validation.matches;
		if (value !== allData[matches.field]) errors.push({
			field: field.name,
			message: matches.message,
			rule: "matches"
		});
	}
	if (validation.custom) {
		const customValidator = context.input?.validators?.[validation.custom];
		if (typeof customValidator === "function") {
			const customResult = await customValidator(value, allData, field);
			if (customResult !== true) {
				const message = typeof customResult === "string" ? customResult : "Validation failed";
				errors.push({
					field: field.name,
					message,
					rule: "custom"
				});
			}
		}
	}
	return errors;
}
function isEmpty(value) {
	if (value === null || value === void 0) return true;
	if (typeof value === "string") return value.trim() === "";
	if (Array.isArray(value)) return value.length === 0;
	return false;
}
function isValidEmail(email) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function isValidUrl(url) {
	try {
		const parsed = new URL(url);
		return parsed.protocol === "http:" || parsed.protocol === "https:";
	} catch {
		return false;
	}
}
async function renderForm(options) {
	const { config, fields, data, errors, csrfToken, currentStep, stepInfo } = options;
	const style = config.style || {};
	const classes = style.classes || {};
	const errorMap$1 = /* @__PURE__ */ new Map();
	for (const error of errors) {
		if (!errorMap$1.has(error.field)) errorMap$1.set(error.field, []);
		errorMap$1.get(error.field).push(error.message);
	}
	let html = `<form
		class="${classes.form || "conductor-form"}"
		method="${config.method || "POST"}"
		${config.action ? `action="${escapeHtml$1(config.action)}"` : ""}
		novalidate
	>`;
	const title = stepInfo?.title || config.title;
	const description = stepInfo?.description || config.description;
	if (title) html += `<h2 class="form-title">${escapeHtml$1(title)}</h2>`;
	if (description) html += `<p class="form-description">${escapeHtml$1(description)}</p>`;
	if (csrfToken) {
		const csrfFieldName = config.csrf?.fieldName || "_csrf";
		html += `<input type="hidden" name="${escapeHtml$1(csrfFieldName)}" value="${escapeHtml$1(csrfToken)}">`;
	}
	if (config.honeypot) html += `<input type="text" name="${escapeHtml$1(config.honeypot)}" value="" style="position:absolute;left:-9999px;" tabindex="-1" autocomplete="off" aria-hidden="true">`;
	if (currentStep) html += `<input type="hidden" name="_currentStep" value="${escapeHtml$1(currentStep)}">`;
	for (const field of fields) html += renderField(field, data[field.name], errorMap$1.get(field.name), classes);
	if (config.captcha) html += renderCaptcha(config.captcha.type, config.captcha.siteKey, config.captcha);
	html += `<div class="form-actions">
		<button type="submit" class="${classes.button || "form-submit"}">
			${escapeHtml$1(config.submitText || "Submit")}
		</button>
	</div>`;
	html += `</form>`;
	if (style.includeDefaultStyles !== false) html = renderDefaultStyles() + html;
	return html;
}
function renderField(field, value, errors, classes) {
	const hasError = errors && errors.length > 0;
	let html = `<div class="${`${classes.field || "form-field"} ${hasError ? "has-error" : ""}`.trim()}">`;
	if (field.label && field.type !== "hidden") {
		const required = field.validation?.required ? " <span class=\"required\">*</span>" : "";
		html += `<label for="${field.name}" class="${classes.label || "form-label"}">
			${escapeHtml$1(field.label)}${required}
		</label>`;
	}
	html += renderFieldInput(field, value, classes);
	if (field.help) html += `<div class="${classes.help || "form-help"}">${escapeHtml$1(field.help)}</div>`;
	if (hasError) for (const error of errors) html += `<div class="${classes.error || "form-error"}">${escapeHtml$1(error)}</div>`;
	html += `</div>`;
	return html;
}
function renderFieldInput(field, value, classes) {
	const inputClass = `${classes.input || "form-input"} ${field.className || ""}`.trim();
	const commonAttrs = `
		name="${escapeHtml$1(field.name)}"
		id="${field.name}"
		class="${inputClass}"
		${field.placeholder ? `placeholder="${escapeHtml$1(field.placeholder)}"` : ""}
		${field.disabled ? "disabled" : ""}
		${field.readonly ? "readonly" : ""}
		${field.autocomplete ? `autocomplete="${escapeHtml$1(field.autocomplete)}"` : ""}
	`.trim();
	switch (field.type) {
		case "textarea": return `<textarea ${commonAttrs} ${field.rows ? `rows="${field.rows}"` : ""} ${field.cols ? `cols="${field.cols}"` : ""}>${escapeHtml$1(String(value || field.default || ""))}</textarea>`;
		case "select": return renderSelectField(field, value, commonAttrs);
		case "checkbox": return renderCheckboxField(field, value, commonAttrs);
		case "radio": return renderRadioField(field, value, commonAttrs);
		case "hidden": return `<input type="hidden" name="${escapeHtml$1(field.name)}" value="${escapeHtml$1(String(value || field.default || ""))}">`;
		default: return `<input
				type="${field.type}"
				${commonAttrs}
				${field.min !== void 0 ? `min="${field.min}"` : ""}
				${field.max !== void 0 ? `max="${field.max}"` : ""}
				${field.step !== void 0 ? `step="${field.step}"` : ""}
				${field.accept ? `accept="${escapeHtml$1(field.accept)}"` : ""}
				value="${escapeHtml$1(String(value || field.default || ""))}"
			>`;
	}
}
function renderSelectField(field, value, commonAttrs) {
	let html = `<select ${commonAttrs} ${field.multiple ? "multiple" : ""}>`;
	const options = normalizeOptions(field.options || []);
	const selectedValues = field.multiple && Array.isArray(value) ? value : [value];
	for (const option of options) {
		const selected = selectedValues.includes(option.value) || option.selected;
		html += `<option value="${escapeHtml$1(option.value)}" ${selected ? "selected" : ""} ${option.disabled ? "disabled" : ""}>
			${escapeHtml$1(option.label)}
		</option>`;
	}
	html += `</select>`;
	return html;
}
function renderCheckboxField(field, value, commonAttrs) {
	return `<input type="checkbox" ${commonAttrs} ${Boolean(value || field.default) ? "checked" : ""} value="true">`;
}
function renderRadioField(field, value, commonAttrs) {
	const options = normalizeOptions(field.options || []);
	let html = "";
	for (const option of options) {
		const checked = value === option.value || option.selected;
		html += `<label class="radio-option">
			<input
				type="radio"
				name="${escapeHtml$1(field.name)}"
				value="${escapeHtml$1(option.value)}"
				${checked ? "checked" : ""}
				${option.disabled ? "disabled" : ""}
			>
			${escapeHtml$1(option.label)}
		</label>`;
	}
	return html;
}
function normalizeOptions(options) {
	return options.map((opt) => typeof opt === "string" ? {
		label: opt,
		value: opt
	} : opt);
}
function renderCaptcha(type, siteKey, config) {
	switch (type) {
		case "turnstile": return `<div class="cf-turnstile"
				data-sitekey="${escapeHtml$1(siteKey)}"
				data-theme="${config.theme || "auto"}"
				data-size="${config.size || "normal"}">
			</div>
			<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer><\/script>`;
		case "recaptcha": return `<div class="g-recaptcha"
				data-sitekey="${escapeHtml$1(siteKey)}"
				data-theme="${config.theme || "light"}"
				data-size="${config.size || "normal"}">
			</div>
			<script src="https://www.google.com/recaptcha/api.js" async defer><\/script>`;
		case "hcaptcha": return `<div class="h-captcha"
				data-sitekey="${escapeHtml$1(siteKey)}"
				data-theme="${config.theme || "light"}"
				data-size="${config.size || "normal"}">
			</div>
			<script src="https://js.hcaptcha.com/1/api.js" async defer><\/script>`;
		default: return "";
	}
}
function renderDefaultStyles() {
	return `<style>
		.conductor-form {
			max-width: 600px;
			margin: 0 auto;
			padding: 2rem;
		}
		.form-title {
			margin: 0 0 0.5rem;
			font-size: 1.75rem;
			font-weight: 600;
		}
		.form-description {
			margin: 0 0 1.5rem;
			color: #666;
		}
		.form-field {
			margin-bottom: 1.5rem;
		}
		.form-label {
			display: block;
			margin-bottom: 0.5rem;
			font-weight: 500;
		}
		.required {
			color: #e53e3e;
		}
		.form-input, .form-input textarea, .form-input select {
			width: 100%;
			padding: 0.5rem 0.75rem;
			border: 1px solid #d1d5db;
			border-radius: 0.375rem;
			font-size: 1rem;
			transition: border-color 0.15s;
		}
		.form-input:focus {
			outline: none;
			border-color: #3b82f6;
			box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
		}
		.form-help {
			margin-top: 0.25rem;
			font-size: 0.875rem;
			color: #6b7280;
		}
		.form-error {
			margin-top: 0.25rem;
			font-size: 0.875rem;
			color: #e53e3e;
		}
		.has-error .form-input {
			border-color: #e53e3e;
		}
		.radio-option {
			display: block;
			margin-bottom: 0.5rem;
		}
		.radio-option input {
			margin-right: 0.5rem;
		}
		.form-actions {
			margin-top: 2rem;
		}
		.form-submit {
			padding: 0.75rem 1.5rem;
			background-color: #3b82f6;
			color: white;
			border: none;
			border-radius: 0.375rem;
			font-size: 1rem;
			font-weight: 500;
			cursor: pointer;
			transition: background-color 0.15s;
		}
		.form-submit:hover {
			background-color: #2563eb;
		}
		.form-submit:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	</style>`;
}
function escapeHtml$1(str) {
	const map$2 = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		"\"": "&quot;",
		"'": "&#39;"
	};
	return str.replace(/[&<>"']/g, (char) => map$2[char]);
}
async function generateCsrfToken(config, env) {
	const secret = config.secret || "default-csrf-secret";
	const expiresIn = config.expiresIn || 3600;
	const tokenValue = generateRandomString(32);
	const payload = {
		value: tokenValue,
		expiresAt: Date.now() + expiresIn * 1e3
	};
	const signature = await signData(JSON.stringify(payload), secret);
	const token = btoa(JSON.stringify({
		...payload,
		signature
	}));
	const kv = env.CSRF_TOKENS;
	if (kv) await kv.put(tokenValue, JSON.stringify(payload), { expirationTtl: expiresIn });
	return token;
}
async function validateCsrfToken(token, config, env) {
	if (!token) return false;
	try {
		const secret = config.secret || "default-csrf-secret";
		const { value, expiresAt, signature } = JSON.parse(atob(token));
		if (Date.now() > expiresAt) return false;
		const payload = {
			value,
			expiresAt
		};
		if (signature !== await signData(JSON.stringify(payload), secret)) return false;
		const kv = env.CSRF_TOKENS;
		if (kv) {
			if (!await kv.get(value)) return false;
			await kv.delete(value);
		}
		return true;
	} catch (error) {
		return false;
	}
}
function generateRandomString(length) {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let result = "";
	if (typeof crypto !== "undefined" && crypto.getRandomValues) {
		const array = new Uint8Array(length);
		crypto.getRandomValues(array);
		for (let i = 0; i < length; i++) result += chars[array[i] % 62];
	} else for (let i = 0; i < length; i++) result += chars[Math.floor(Math.random() * 62)];
	return result;
}
async function signData(data, secret) {
	if (typeof crypto !== "undefined" && crypto.subtle) {
		const encoder = new TextEncoder();
		const keyData = encoder.encode(secret);
		const messageData = encoder.encode(data);
		const key = await crypto.subtle.importKey("raw", keyData, {
			name: "HMAC",
			hash: "SHA-256"
		}, false, ["sign"]);
		const signature = await crypto.subtle.sign("HMAC", key, messageData);
		return Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("");
	}
	return simpleHash(data + secret);
}
function simpleHash(str) {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return Math.abs(hash).toString(16);
}
async function checkRateLimit(identifier, config, kv) {
	if (!kv) return {
		allowed: true,
		remaining: config.max,
		reset: Date.now() + config.window * 1e3,
		limit: config.max
	};
	const key = `rate-limit:${identifier}`;
	const now = Date.now();
	const windowMs = config.window * 1e3;
	const stored = await kv.get(key, "json");
	let data;
	if (stored) {
		data = stored;
		if (now > data.resetAt) data = {
			count: 0,
			resetAt: now + windowMs
		};
	} else data = {
		count: 0,
		resetAt: now + windowMs
	};
	if (data.count >= config.max) return {
		allowed: false,
		remaining: 0,
		reset: data.resetAt,
		limit: config.max
	};
	data.count++;
	const ttl = Math.ceil((data.resetAt - now) / 1e3);
	await kv.put(key, JSON.stringify(data), { expirationTtl: ttl });
	return {
		allowed: true,
		remaining: config.max - data.count,
		reset: data.resetAt,
		limit: config.max
	};
}
init_base_agent();
var FormAgent = class extends BaseAgent {
	constructor(config) {
		super(config);
		this.formConfig = config;
		this.validateConfig();
	}
	validateConfig() {
		if (!this.formConfig.fields && !this.formConfig.steps) throw new Error("Form agent requires either fields or steps configuration");
		if (this.formConfig.fields && this.formConfig.steps) throw new Error("Form agent cannot have both fields and steps - use one or the other");
		if (this.formConfig.captcha) {
			if (!this.formConfig.captcha.siteKey) throw new Error("CAPTCHA configuration requires siteKey");
		}
		if (this.formConfig.csrf?.enabled) {
			if (!this.formConfig.csrf.secret) throw new Error("CSRF protection requires a secret");
		}
	}
	async run(context) {
		const input = context.input;
		const mode = input.mode || "render";
		if (this.formConfig.rateLimit) {
			const rateLimitResult = await checkRateLimit(input.request?.ip || "anonymous", this.formConfig.rateLimit, context.env.RATE_LIMIT);
			if (!rateLimitResult.allowed) return {
				valid: false,
				errors: [{
					field: "_form",
					message: "Rate limit exceeded. Please try again later.",
					rule: "rate_limit"
				}],
				rateLimit: {
					remaining: rateLimitResult.remaining,
					reset: rateLimitResult.reset
				}
			};
		}
		switch (mode) {
			case "render": return this.renderForm(input, context);
			case "validate": return this.validateForm(input, context);
			case "submit": return this.submitForm(input, context);
			default: throw new Error(`Invalid form mode: ${mode}`);
		}
	}
	async renderForm(input, context) {
		let csrfToken;
		if (this.formConfig.csrf?.enabled) csrfToken = await generateCsrfToken(this.formConfig.csrf, context.env);
		const currentStep = this.getCurrentStep(input);
		const fields = this.getFieldsForStep(currentStep);
		return {
			html: await renderForm({
				config: this.formConfig,
				fields,
				data: input.data || {},
				csrfToken,
				currentStep: currentStep?.id,
				stepInfo: currentStep || void 0,
				errors: []
			}),
			currentStep: currentStep?.id,
			csrfToken,
			valid: true
		};
	}
	async validateForm(input, context) {
		const data = input.data || {};
		const errors = [];
		if (this.formConfig.honeypot && data[this.formConfig.honeypot]) return {
			valid: false,
			errors: [{
				field: "_form",
				message: "Form submission failed",
				rule: "honeypot"
			}]
		};
		if (this.formConfig.csrf?.enabled) {
			const csrfToken = data[this.formConfig.csrf.fieldName || "_csrf"];
			if (!await validateCsrfToken(csrfToken, this.formConfig.csrf, context.env)) errors.push({
				field: "_csrf",
				message: "Invalid or expired security token",
				rule: "csrf"
			});
		}
		const currentStep = this.getCurrentStep(input);
		const fields = this.getFieldsForStep(currentStep);
		for (const field of fields) {
			const value = data[field.name];
			const fieldErrors = await validateField(field, value, data, context);
			errors.push(...fieldErrors);
		}
		const sanitizedData = this.sanitizeData(data, fields);
		return {
			valid: errors.length === 0,
			errors: errors.length > 0 ? errors : void 0,
			data: sanitizedData,
			currentStep: currentStep?.id
		};
	}
	async submitForm(input, context) {
		const validationResult = await this.validateForm(input, context);
		if (!validationResult.valid) return validationResult;
		if (this.formConfig.steps) {
			const currentStepIndex = this.formConfig.steps.findIndex((step) => step.id === input.currentStep);
			const nextStep = this.formConfig.steps[currentStepIndex + 1];
			return {
				...validationResult,
				currentStep: input.currentStep,
				nextStep: nextStep?.id,
				isLastStep: !nextStep
			};
		}
		return {
			...validationResult,
			isLastStep: true
		};
	}
	getCurrentStep(input) {
		if (!this.formConfig.steps) return null;
		if (input.currentStep) {
			const step = this.formConfig.steps.find((s) => s.id === input.currentStep);
			if (step) return step;
		}
		return this.formConfig.steps[0];
	}
	getFieldsForStep(step) {
		if (step) return step.fields;
		return this.formConfig.fields || [];
	}
	sanitizeData(data, fields) {
		const sanitized = {};
		for (const field of fields) {
			const value = data[field.name];
			if (value === void 0 || value === null) continue;
			switch (field.type) {
				case "email":
					sanitized[field.name] = String(value).toLowerCase().trim();
					break;
				case "number":
					sanitized[field.name] = Number(value);
					break;
				case "checkbox":
					sanitized[field.name] = Boolean(value);
					break;
				case "select":
					if (field.multiple && Array.isArray(value)) sanitized[field.name] = value.map((v) => String(v).trim());
					else sanitized[field.name] = String(value).trim();
					break;
				case "textarea":
				case "text":
				case "password":
				case "tel":
				case "url":
				default: sanitized[field.name] = String(value).trim();
			}
		}
		return sanitized;
	}
};
function renderPageHead(head, seo) {
	const parts = [];
	parts.push("<meta charset=\"UTF-8\">");
	parts.push("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">");
	if (head.title) parts.push(`<title>${escapeHtml(head.title)}</title>`);
	if (head.meta) for (const meta of head.meta) parts.push(renderMetaTag(meta));
	if (seo?.canonical) parts.push(`<link rel="canonical" href="${escapeHtml(seo.canonical)}">`);
	if (seo?.robots) parts.push(`<meta name="robots" content="${escapeHtml(seo.robots)}">`);
	if (seo?.alternates) for (const alt of seo.alternates) parts.push(`<link rel="alternate" hreflang="${escapeHtml(alt.hreflang)}" href="${escapeHtml(alt.href)}">`);
	if (head.og) {
		if (head.og.title) parts.push(`<meta property="og:title" content="${escapeHtml(head.og.title)}">`);
		if (head.og.description) parts.push(`<meta property="og:description" content="${escapeHtml(head.og.description)}">`);
		if (head.og.image) parts.push(`<meta property="og:image" content="${escapeHtml(head.og.image)}">`);
		if (head.og.url) parts.push(`<meta property="og:url" content="${escapeHtml(head.og.url)}">`);
		if (head.og.type) parts.push(`<meta property="og:type" content="${escapeHtml(head.og.type)}">`);
		if (head.og.siteName) parts.push(`<meta property="og:site_name" content="${escapeHtml(head.og.siteName)}">`);
		if (head.og.locale) parts.push(`<meta property="og:locale" content="${escapeHtml(head.og.locale)}">`);
	}
	if (head.twitter) {
		if (head.twitter.card) parts.push(`<meta name="twitter:card" content="${escapeHtml(head.twitter.card)}">`);
		if (head.twitter.site) parts.push(`<meta name="twitter:site" content="${escapeHtml(head.twitter.site)}">`);
		if (head.twitter.creator) parts.push(`<meta name="twitter:creator" content="${escapeHtml(head.twitter.creator)}">`);
		if (head.twitter.title) parts.push(`<meta name="twitter:title" content="${escapeHtml(head.twitter.title)}">`);
		if (head.twitter.description) parts.push(`<meta name="twitter:description" content="${escapeHtml(head.twitter.description)}">`);
		if (head.twitter.image) parts.push(`<meta name="twitter:image" content="${escapeHtml(head.twitter.image)}">`);
	}
	if (head.links) for (const link of head.links) parts.push(renderLinkTag(link));
	if (head.scripts) {
		for (const script of head.scripts) if (!script.defer && !script.async) parts.push(renderScriptTag(script));
	}
	if (seo?.jsonLd && seo.jsonLd.length > 0) for (const schema$3 of seo.jsonLd) parts.push(`<script type="application/ld+json">${JSON.stringify(schema$3)}<\/script>`);
	return parts.join("\n	");
}
function renderMetaTag(meta) {
	const attrs = [];
	if (meta.name) attrs.push(`name="${escapeHtml(meta.name)}"`);
	if (meta.property) attrs.push(`property="${escapeHtml(meta.property)}"`);
	if (meta.content) attrs.push(`content="${escapeHtml(meta.content)}"`);
	if (meta.charset) attrs.push(`charset="${escapeHtml(meta.charset)}"`);
	if (meta.httpEquiv) attrs.push(`http-equiv="${escapeHtml(meta.httpEquiv)}"`);
	return `<meta ${attrs.join(" ")}>`;
}
function renderLinkTag(link) {
	const attrs = [`rel="${escapeHtml(link.rel)}"`, `href="${escapeHtml(link.href)}"`];
	if (link.type) attrs.push(`type="${escapeHtml(link.type)}"`);
	if (link.media) attrs.push(`media="${escapeHtml(link.media)}"`);
	if (link.crossorigin) attrs.push(`crossorigin="${escapeHtml(link.crossorigin)}"`);
	if (link.integrity) attrs.push(`integrity="${escapeHtml(link.integrity)}"`);
	return `<link ${attrs.join(" ")}>`;
}
function renderScriptTag(script) {
	const attrs = [];
	if (script.src) attrs.push(`src="${escapeHtml(script.src)}"`);
	if (script.type) attrs.push(`type="${escapeHtml(script.type)}"`);
	if (script.async) attrs.push("async");
	if (script.defer) attrs.push("defer");
	if (script.crossorigin) attrs.push(`crossorigin="${escapeHtml(script.crossorigin)}"`);
	if (script.integrity) attrs.push(`integrity="${escapeHtml(script.integrity)}"`);
	if (script.inline) return `<script ${attrs.join(" ")}>${script.inline}<\/script>`;
	else return `<script ${attrs.join(" ")}><\/script>`;
}
function escapeHtml(str) {
	const map$2 = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		"\"": "&quot;",
		"'": "&#39;"
	};
	return str.replace(/[&<>"']/g, (char) => map$2[char]);
}
function renderHydrationScript(config, props) {
	switch (config.strategy) {
		case "none": return "";
		case "htmx": return renderHtmxHydration(config.htmx, props);
		case "progressive": return renderProgressiveHydration(config, props);
		case "islands": return renderIslandsHydration(config, props);
		default: return "";
	}
}
function renderHtmxHydration(htmxConfig, props) {
	if (!htmxConfig?.enabled) return "";
	const version = htmxConfig.version || "1.9.10";
	const parts = [];
	parts.push(renderScriptTag({
		src: `https://unpkg.com/htmx.org@${version}`,
		defer: true,
		integrity: void 0,
		crossorigin: "anonymous"
	}));
	if (htmxConfig.extensions && htmxConfig.extensions.length > 0) for (const ext of htmxConfig.extensions) parts.push(renderScriptTag({
		src: `https://unpkg.com/htmx.org@${version}/dist/ext/${ext}.js`,
		defer: true
	}));
	if (htmxConfig.config) {
		const configScript = `
			document.addEventListener('DOMContentLoaded', function() {
				if (window.htmx) {
					htmx.config = Object.assign(htmx.config || {}, ${JSON.stringify(htmxConfig.config)});
				}
			});
		`;
		parts.push(renderScriptTag({
			inline: configScript,
			defer: true
		}));
	}
	return parts.join("\n	");
}
function renderProgressiveHydration(config, props) {
	const parts = [];
	if (config.htmx?.enabled) parts.push(renderHtmxHydration(config.htmx, props));
	if (config.progressive) {
		const { enhanceForms, enhanceLinks, customEnhancements } = config.progressive;
		const progressiveScript = `
			document.addEventListener('DOMContentLoaded', function() {
				${enhanceForms ? enhanceFormsScript() : ""}
				${enhanceLinks ? enhanceLinksScript() : ""}
				${customEnhancements ? enhanceCustomScript(customEnhancements) : ""}
			});
		`;
		parts.push(renderScriptTag({
			inline: progressiveScript,
			defer: true
		}));
	}
	return parts.join("\n	");
}
function enhanceFormsScript() {
	return `
		// Enhance forms with htmx
		document.querySelectorAll('form:not([data-no-enhance])').forEach(function(form) {
			if (!form.hasAttribute('hx-post') && !form.hasAttribute('hx-get')) {
				form.setAttribute('hx-post', form.action || window.location.href);
				form.setAttribute('hx-target', 'body');
				form.setAttribute('hx-swap', 'outerHTML');
			}
		});
	`;
}
function enhanceLinksScript() {
	return `
		// Enhance navigation links with htmx
		document.querySelectorAll('a[href]:not([data-no-enhance]):not([target="_blank"])').forEach(function(link) {
			if (!link.hasAttribute('hx-get')) {
				const href = link.getAttribute('href');
				if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
					link.setAttribute('hx-get', href);
					link.setAttribute('hx-target', 'body');
					link.setAttribute('hx-swap', 'outerHTML');
					link.setAttribute('hx-push-url', 'true');
				}
			}
		});
	`;
}
function enhanceCustomScript(enhancements) {
	const scripts = [];
	for (const enhancement of enhancements) {
		const attrs = Object.entries(enhancement.attributes).map(([key, value]) => `element.setAttribute('${key}', '${value}');`).join("\n				");
		scripts.push(`
			document.querySelectorAll('${enhancement.selector}').forEach(function(element) {
				${attrs}
			});
		`);
	}
	return scripts.join("\n		");
}
function renderIslandsHydration(config, props) {
	if (!config.islands || config.islands.length === 0) return "";
	const islands = config.islands;
	return renderScriptTag({
		inline: `
		// Island hydration
		(function() {
			const islands = ${JSON.stringify(islands)};
			const observers = new Map();

			function hydrateIsland(island) {
				const element = document.querySelector('[data-island-id="' + island.id + '"]');
				if (!element) return;

				// Mark as hydrated
				element.setAttribute('data-hydrated', 'true');

				// Load and hydrate component
				console.log('Hydrating island:', island.id);

				// In production, this would load the component bundle and hydrate
				// For now, just log
			}

			function setupIsland(island) {
				const element = document.querySelector('[data-island-id="' + island.id + '"]');
				if (!element) return;

				switch (island.loadOn) {
					case 'immediate':
						hydrateIsland(island);
						break;

					case 'visible':
						const observer = new IntersectionObserver(function(entries) {
							entries.forEach(function(entry) {
								if (entry.isIntersecting) {
									hydrateIsland(island);
									observer.disconnect();
								}
							});
						});
						observer.observe(element);
						observers.set(island.id, observer);
						break;

					case 'idle':
						if ('requestIdleCallback' in window) {
							requestIdleCallback(function() { hydrateIsland(island); });
						} else {
							setTimeout(function() { hydrateIsland(island); }, 1);
						}
						break;

					case 'interaction':
						function handleInteraction() {
							hydrateIsland(island);
							element.removeEventListener('mouseenter', handleInteraction);
							element.removeEventListener('focus', handleInteraction);
							element.removeEventListener('touchstart', handleInteraction);
						}
						element.addEventListener('mouseenter', handleInteraction, { once: true });
						element.addEventListener('focus', handleInteraction, { once: true });
						element.addEventListener('touchstart', handleInteraction, { once: true });
						break;
				}
			}

			document.addEventListener('DOMContentLoaded', function() {
				islands.forEach(setupIsland);
			});
		})();
	`,
		defer: true
	});
}
init_base_agent();
var PageAgent = class extends BaseAgent {
	constructor(config) {
		super(config);
		this.pageConfig = config;
		switch (this.pageConfig.templateEngine || "liquid") {
			case "simple":
				this.templateEngine = new SimpleTemplateEngine();
				break;
			case "liquid":
				this.templateEngine = new LiquidTemplateEngine();
				break;
			case "handlebars":
				this.templateEngine = new HandlebarsTemplateEngine();
				break;
			default:
				this.templateEngine = new LiquidTemplateEngine();
				break;
		}
		this.validateConfig();
	}
	validateConfig() {
		const component = this.pageConfig.component || this.pageConfig.config?.component;
		const componentPath = this.pageConfig.componentPath || this.pageConfig.config?.componentPath;
		if (!component && !componentPath) throw new Error("Page agent requires either component or componentPath");
		if (this.pageConfig.config?.component && !this.pageConfig.component) this.pageConfig.component = this.pageConfig.config.component;
		if (this.pageConfig.config?.componentPath && !this.pageConfig.componentPath) this.pageConfig.componentPath = this.pageConfig.config.componentPath;
		if (this.pageConfig.renderMode && ![
			"ssr",
			"static",
			"hybrid"
		].includes(this.pageConfig.renderMode)) throw new Error(`Invalid render mode: ${this.pageConfig.renderMode}`);
		if (this.pageConfig.hydration?.strategy && ![
			"none",
			"htmx",
			"progressive",
			"islands"
		].includes(this.pageConfig.hydration.strategy)) throw new Error(`Invalid hydration strategy: ${this.pageConfig.hydration.strategy}`);
	}
	async run(context) {
		const input = context.input;
		const startTime = Date.now();
		try {
			if (this.pageConfig.cache?.enabled) {
				const cached = await this.checkCache(input, context);
				if (cached) return {
					...cached,
					cacheStatus: "hit"
				};
			}
			let handlerData = {};
			if (this.pageConfig.handler) try {
				const handlerContext = {
					request: input.request || input.request,
					env: context.env,
					ctx: context.ctx,
					params: input.params || {},
					query: input.query || {},
					headers: input.headers || {}
				};
				handlerData = await this.pageConfig.handler(handlerContext);
			} catch (error) {
				console.error("Handler error:", error);
			}
			const component = await this.loadComponent(context);
			const props = {
				...this.pageConfig.input || {},
				...handlerData,
				...input.data,
				...input.props
			};
			if (input.params) props.params = input.params;
			if (input.query) props.query = input.query;
			if (input.headers) props.headers = input.headers;
			if (input.request) props.request = input.request;
			const renderMode = this.pageConfig.renderMode || "ssr";
			let bodyHtml;
			switch (renderMode) {
				case "ssr":
					bodyHtml = await this.renderSSR(component, props, context);
					break;
				case "static":
					bodyHtml = await this.renderStatic(component, props, context);
					break;
				case "hybrid":
					bodyHtml = await this.renderHybrid(component, props, context);
					break;
				default: bodyHtml = await this.renderSSR(component, props, context);
			}
			if (this.pageConfig.layout) bodyHtml = await this.applyLayout(bodyHtml, props, context);
			const head = this.mergeHeadConfig(input.head);
			const headHtml = renderPageHead(head, this.pageConfig.seo);
			const hydrationConfig = this.mergeHydrationConfig(input.hydration);
			const hydrationHtml = this.buildHydrationHtml(hydrationConfig, props);
			const output = {
				html: this.buildFullPage(headHtml, bodyHtml, hydrationHtml),
				status: 200,
				headers: this.buildHeaders(hydrationConfig),
				props,
				renderTime: Date.now() - startTime,
				cacheStatus: "miss",
				seo: this.buildSEOData(head)
			};
			if (this.pageConfig.cache?.enabled) await this.cacheOutput(input, output, context);
			return output;
		} catch (error) {
			if (this.pageConfig.errorComponent) return this.renderErrorPage(error, context);
			throw error;
		}
	}
	async loadComponent(context) {
		if (this.pageConfig.component) return async (props) => {
			const template$1 = this.pageConfig.component || "";
			return await this.templateEngine.render(template$1, props);
		};
		if (this.pageConfig.componentPath) throw new Error("Component loading from path not yet implemented");
		throw new Error("No component available");
	}
	async renderSSR(component, props, context) {
		return await component(props);
	}
	async renderStatic(component, props, context) {
		return this.renderSSR(component, props, context);
	}
	async renderHybrid(component, props, context) {
		const html = await this.renderSSR(component, props, context);
		return this.addHydrationMarkers(html, props);
	}
	addHydrationMarkers(html, props) {
		const propsJson = JSON.stringify(props);
		return `<div data-hydrate="true" data-props="${Buffer.from(propsJson).toString("base64")}">${html}</div>`;
	}
	async applyLayout(content, props, context) {
		if (!this.pageConfig.layout) return content;
		({ ...this.pageConfig.layout.props });
		return `<div class="layout">${content}</div>`;
	}
	mergeHeadConfig(inputHead) {
		return {
			...this.pageConfig.head,
			...inputHead,
			meta: [...this.pageConfig.head?.meta || [], ...inputHead?.meta || []],
			links: [...this.pageConfig.head?.links || [], ...inputHead?.links || []],
			scripts: [...this.pageConfig.head?.scripts || [], ...inputHead?.scripts || []]
		};
	}
	mergeHydrationConfig(inputHydration) {
		return {
			strategy: this.pageConfig.hydration?.strategy || "none",
			...this.pageConfig.hydration,
			...inputHydration
		};
	}
	buildHydrationHtml(hydrationConfig, props) {
		if (hydrationConfig.strategy === "none") return "";
		return renderHydrationScript(hydrationConfig, props);
	}
	buildFullPage(head, body, hydration) {
		return `<!DOCTYPE html>
<html lang="en">
<head>
	${head}
</head>
<body>
	${body}
	${hydration}
</body>
</html>`;
	}
	buildHeaders(hydrationConfig) {
		const headers = { "Content-Type": "text/html; charset=utf-8" };
		if (this.pageConfig.cache?.enabled) {
			headers["Cache-Control"] = `public, max-age=${this.pageConfig.cache.ttl || 3600}`;
			if (this.pageConfig.cache.staleWhileRevalidate) headers["Cache-Control"] += `, stale-while-revalidate=${this.pageConfig.cache.staleWhileRevalidate}`;
			if (this.pageConfig.cache.vary) headers["Vary"] = this.pageConfig.cache.vary.join(", ");
			if (this.pageConfig.cache.tags?.length) headers["Cache-Tag"] = this.pageConfig.cache.tags.join(",");
		}
		return headers;
	}
	buildSEOData(head) {
		const titleMeta = head.meta?.find((m) => m.name === "title" || m.property === "og:title");
		const descMeta = head.meta?.find((m) => m.name === "description" || m.property === "og:description");
		return {
			title: head.title || titleMeta?.content || "",
			description: descMeta?.content,
			canonical: this.pageConfig.seo?.canonical,
			og: head.og,
			twitter: head.twitter,
			jsonLd: this.pageConfig.seo?.jsonLd
		};
	}
	async checkCache(input, context) {
		if (!this.pageConfig.cache?.enabled) return null;
		const cacheKey = this.generatePageCacheKey(input);
		const cached = await context.env.PAGE_CACHE?.get(cacheKey, "json");
		if (cached) return cached;
		return null;
	}
	async cacheOutput(input, output, context) {
		if (!this.pageConfig.cache?.enabled) return;
		const cacheKey = this.generatePageCacheKey(input);
		const ttl = this.pageConfig.cache.ttl || 3600;
		await context.env.PAGE_CACHE?.put(cacheKey, JSON.stringify(output), { expirationTtl: ttl });
	}
	generatePageCacheKey(input) {
		if (this.pageConfig.cache?.keyGenerator) {}
		const url = input.request?.url || "";
		const propsHash = JSON.stringify(input.props || {});
		return `page:${this.name}:${url}:${propsHash}`;
	}
	async renderErrorPage(error, context) {
		return {
			html: `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Error</title>
	<style>
		body {
			font-family: system-ui, -apple-system, sans-serif;
			max-width: 600px;
			margin: 100px auto;
			padding: 20px;
			text-align: center;
		}
		h1 { color: #e53e3e; }
		pre {
			background: #f7fafc;
			padding: 15px;
			border-radius: 5px;
			text-align: left;
			overflow-x: auto;
		}
	</style>
</head>
<body>
	<h1>Page Render Error</h1>
	<p>${error.message}</p>
	${this.pageConfig.dev ? `<pre>${error.stack}</pre>` : ""}
</body>
</html>`,
			status: 500,
			headers: { "Content-Type": "text/html; charset=utf-8" },
			renderTime: 0,
			cacheStatus: "bypass",
			seo: {
				title: "Error",
				description: "An error occurred while rendering the page"
			}
		};
	}
};
function detectTemplateEngine(key, content) {
	if (key.endsWith(".hbs") || key.endsWith(".handlebars")) return "handlebars";
	if (key.endsWith(".liquid")) return "liquid";
	if (key.endsWith(".mjml")) return "mjml";
	if (content && content.includes("<mjml>")) return "mjml";
	if (content && /\{%.*%\}/.test(content)) return "liquid";
	if (content && /\{\{(#(unless|with|lookup|log)|@root|@index|@key|>\s*\w+\.\w+)/.test(content)) return "handlebars";
	return "simple";
}
async function loadTemplate(source, env) {
	if (source.inline) {
		const engine = source.engine || detectTemplateEngine("inline", source.inline);
		return {
			content: source.inline,
			engine,
			source: "inline"
		};
	}
	if (source.kv) {
		if (!env?.TEMPLATES) throw new Error("KV namespace TEMPLATES is not configured");
		const content = await env.TEMPLATES.get(source.kv, "text");
		if (!content) throw new Error(`Template not found in KV: ${source.kv}`);
		return {
			content,
			engine: source.engine || detectTemplateEngine(source.kv, content),
			source: "kv"
		};
	}
	if (source.r2) {
		if (!env?.ASSETS) throw new Error("R2 bucket ASSETS is not configured");
		const object = await env.ASSETS.get(source.r2);
		if (!object) throw new Error(`Template not found in R2: ${source.r2}`);
		const content = await object.text();
		return {
			content,
			engine: source.engine || detectTemplateEngine(source.r2, content),
			source: "r2"
		};
	}
	if (source.file) throw new Error("File-based templates are not supported in Cloudflare Workers. Use inline, KV (TEMPLATES), or R2 (ASSETS) instead.");
	throw new Error("No valid template source specified (inline, kv, or r2)");
}
function normalizeTemplateSource(source) {
	if (typeof source === "string") {
		if (source.startsWith("kv://")) return { kv: source.slice(5) };
		if (source.startsWith("r2://")) return { r2: source.slice(5) };
		if (source.startsWith("file://")) return { file: source.slice(7) };
		return { inline: source };
	}
	return source;
}
function serializeCookie(name, value, options = {}) {
	const pairs$1 = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];
	if (options.maxAge !== void 0) pairs$1.push(`Max-Age=${options.maxAge}`);
	if (options.expires) pairs$1.push(`Expires=${options.expires.toUTCString()}`);
	if (options.domain) pairs$1.push(`Domain=${options.domain}`);
	if (options.path) pairs$1.push(`Path=${options.path}`);
	else pairs$1.push("Path=/");
	if (options.secure) pairs$1.push("Secure");
	if (options.httpOnly) pairs$1.push("HttpOnly");
	if (options.sameSite) {
		const sameSite = options.sameSite.charAt(0).toUpperCase() + options.sameSite.slice(1);
		pairs$1.push(`SameSite=${sameSite}`);
	}
	return pairs$1.join("; ");
}
async function signCookie(value, secret) {
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey("raw", encoder.encode(secret), {
		name: "HMAC",
		hash: "SHA-256"
	}, false, ["sign"]);
	const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
	return `${value}.${btoa(String.fromCharCode(...new Uint8Array(signature)))}`;
}
async function unsignCookie(signedValue, secret) {
	const lastDotIndex = signedValue.lastIndexOf(".");
	if (lastDotIndex === -1) return null;
	const value = signedValue.slice(0, lastDotIndex);
	const signatureBase64 = signedValue.slice(lastDotIndex + 1);
	try {
		const expectedSigned = await signCookie(value, secret);
		if (signatureBase64 === expectedSigned.slice(expectedSigned.lastIndexOf(".") + 1)) return {
			name: "",
			value,
			valid: true
		};
		return {
			name: "",
			value,
			valid: false
		};
	} catch {
		return null;
	}
}
async function createSetCookieHeader(cookie, secret) {
	let value = cookie.value;
	if (cookie.options?.signed && secret) value = await signCookie(value, secret);
	return serializeCookie(cookie.name, value, cookie.options);
}
function createDeleteCookie(name, options = {}) {
	return serializeCookie(name, "", {
		...options,
		expires: /* @__PURE__ */ new Date(0),
		maxAge: 0
	});
}
async function parseSignedCookies(cookies, secret) {
	const parsed = {};
	for (const [name, value] of Object.entries(cookies)) {
		const unsigned = await unsignCookie(value, secret);
		if (unsigned) parsed[name] = {
			...unsigned,
			name
		};
		else parsed[name] = {
			name,
			value,
			valid: void 0
		};
	}
	return parsed;
}
function isValidCookieName(name) {
	return name.length > 0 && !/[()<>@,;:\\"\/\[\]?={}]/.test(name);
}
function mergeCookieOptions(options, defaults) {
	return {
		...defaults,
		...options
	};
}
init_base_agent();
var HtmlMember = class extends BaseAgent {
	constructor(config) {
		super(config);
		this.htmlConfig = config;
		this.validateConfig();
	}
	validateConfig() {
		if (!this.htmlConfig.template) throw new Error("HTML agent requires a template configuration");
	}
	async run(context) {
		const startTime = Date.now();
		const input = context.input;
		const templateResult = await loadTemplate(input.template ? normalizeTemplateSource(input.template) : this.htmlConfig.template, {
			TEMPLATES: context.env.KV,
			ASSETS: context.env.STORAGE
		});
		const requestCookies = input.cookies || {};
		let readCookies = {};
		if (Object.keys(requestCookies).length > 0) if (this.htmlConfig.cookieSecret) {
			const parsed = await parseSignedCookies(requestCookies, this.htmlConfig.cookieSecret);
			readCookies = Object.entries(parsed).reduce((acc, [name, cookie]) => {
				acc[name] = cookie.value;
				return acc;
			}, {});
		} else readCookies = requestCookies;
		const engine = createTemplateEngine(templateResult.engine);
		if (context.env.COMPONENTS && engine instanceof SimpleTemplateEngine) {
			let cache;
			if (context.env.CACHE) {
				const { MemoryCache } = await import("./cache-Cn73T2ra.js");
				cache = new MemoryCache({ defaultTTL: 3600 });
			}
			const componentLoader = createComponentLoader({
				kv: context.env.COMPONENTS,
				cache,
				logger: context.logger
			});
			engine.setComponentLoader(componentLoader);
		}
		const templateContext = {
			data: {
				...input.data,
				cookies: readCookies
			},
			helpers: this.getDefaultHelpers(),
			partials: {}
		};
		let html = await engine.render(templateResult.content, templateContext);
		if (input.layout && engine instanceof SimpleTemplateEngine) {
			const layoutContent = await this.loadLayoutContent(input.layout, context, engine);
			if (layoutContent) html = await engine.render(layoutContent, {
				data: {
					...templateContext.data,
					content: html
				},
				helpers: templateContext.helpers,
				partials: templateContext.partials
			});
		}
		const renderOptions = {
			...this.htmlConfig.renderOptions,
			...input.renderOptions
		};
		if (renderOptions?.inlineCss) html = await this.inlineCss(html);
		if (renderOptions?.minify) html = this.minifyHtml(html);
		const setCookieHeaders = [];
		if (input.setCookies && input.setCookies.length > 0) for (const cookie of input.setCookies) {
			if (!isValidCookieName(cookie.name)) throw new Error(`Invalid cookie name: ${cookie.name}`);
			const options = mergeCookieOptions(cookie.options, this.htmlConfig.defaultCookieOptions);
			const header = await createSetCookieHeader({
				...cookie,
				options
			}, this.htmlConfig.cookieSecret);
			setCookieHeaders.push(header);
		}
		if (input.deleteCookies && input.deleteCookies.length > 0) for (const cookieName of input.deleteCookies) {
			const deleteHeader = createDeleteCookie(cookieName, this.htmlConfig.defaultCookieOptions);
			setCookieHeaders.push(deleteHeader);
		}
		const renderTime = Date.now() - startTime;
		return {
			html,
			cookies: setCookieHeaders.length > 0 ? setCookieHeaders : void 0,
			readCookies: Object.keys(readCookies).length > 0 ? readCookies : void 0,
			engine: templateResult.engine,
			metadata: {
				renderTime,
				templateSize: templateResult.content.length,
				outputSize: html.length,
				cssInlined: renderOptions?.inlineCss || false,
				minified: renderOptions?.minify || false
			}
		};
	}
	async loadLayoutContent(layout, context, engine) {
		if (layout.includes("://")) {
			if (context.env.COMPONENTS) {
				let cache;
				if (context.env.CACHE) {
					const { MemoryCache } = await import("./cache-Cn73T2ra.js");
					cache = new MemoryCache({ defaultTTL: 3600 });
				}
				const componentLoader = createComponentLoader({
					kv: context.env.COMPONENTS,
					cache,
					logger: context.logger
				});
				try {
					return await componentLoader.load(layout);
				} catch (error) {
					context.logger?.warn("Failed to load layout", {
						layout,
						error: error instanceof Error ? error.message : String(error)
					});
					return null;
				}
			}
		}
		return null;
	}
	getDefaultHelpers() {
		return {
			formatDate: (date$1, format$1) => {
				return (typeof date$1 === "string" ? new Date(date$1) : date$1).toLocaleDateString("en-US", {
					year: "numeric",
					month: "long",
					day: "numeric"
				});
			},
			uppercase: (str) => String(str).toUpperCase(),
			lowercase: (str) => String(str).toLowerCase(),
			capitalize: (str) => {
				const s = String(str);
				return s.charAt(0).toUpperCase() + s.slice(1);
			},
			currency: (amount, currency = "USD") => {
				return new Intl.NumberFormat("en-US", {
					style: "currency",
					currency: String(currency)
				}).format(Number(amount));
			},
			eq: (a, b) => a === b,
			ne: (a, b) => a !== b,
			lt: (a, b) => Number(a) < Number(b),
			gt: (a, b) => Number(a) > Number(b),
			and: (...args) => args.every(Boolean),
			or: (...args) => args.some(Boolean)
		};
	}
	async inlineCss(html) {
		const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
		const styles = [];
		let match;
		while ((match = styleRegex.exec(html)) !== null) styles.push(match[1]);
		if (styles.length === 0) return html;
		let result = html;
		for (const style of styles) {
			const rules = style.match(/([.#][\w-]+)\s*\{([^}]+)\}/g);
			if (rules) for (const rule of rules) {
				const [, selector, properties] = rule.match(/([.#][\w-]+)\s*\{([^}]+)\}/) || [];
				if (selector && properties) {
					const trimmedProps = properties.trim();
					if (selector.startsWith(".")) {
						const className = selector.slice(1);
						const classRegex = new RegExp(`(<[^>]*class=["'][^"']*\\b${className}\\b[^"']*["'][^>]*)(>)`, "g");
						result = result.replace(classRegex, `$1 style="${trimmedProps}"$2`);
					} else if (selector.startsWith("#")) {
						const idName = selector.slice(1);
						const idRegex = new RegExp(`(<[^>]*id=["']${idName}["'][^>]*)(>)`, "g");
						result = result.replace(idRegex, `$1 style="${trimmedProps}"$2`);
					}
				}
			}
		}
		result = result.replace(styleRegex, "");
		return result;
	}
	minifyHtml(html) {
		return html.replace(/<!--[\s\S]*?-->/g, "").replace(/>\s+</g, "><").trim();
	}
};
async function generatePdf(options, env) {
	if (env?.BROWSER) return await generatePdfWithBrowser(options, env.BROWSER);
	return await generatePdfBasic(options);
}
async function generatePdfWithBrowser(options, browser) {
	const startTime = Date.now();
	const session = await browser.newSession();
	try {
		const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(options.html)}`;
		await session.goto(dataUrl, { waitUntil: "networkidle" });
		const pdfOptions = {
			format: options.page?.size || "A4",
			landscape: options.page?.orientation === "landscape",
			printBackground: options.page?.printBackground !== false,
			margin: {
				top: `${options.page?.margins?.top || 10}mm`,
				right: `${options.page?.margins?.right || 10}mm`,
				bottom: `${options.page?.margins?.bottom || 10}mm`,
				left: `${options.page?.margins?.left || 10}mm`
			}
		};
		if (options.headerFooter?.displayHeaderFooter) {
			pdfOptions.displayHeaderFooter = true;
			pdfOptions.headerTemplate = options.headerFooter.header || "";
			pdfOptions.footerTemplate = options.headerFooter.footer || "";
		}
		if (options.page?.scale) pdfOptions.scale = options.page.scale;
		const pdfBuffer = await session.pdf(pdfOptions);
		return {
			pdf: pdfBuffer instanceof ArrayBuffer ? pdfBuffer : new Uint8Array(pdfBuffer).buffer,
			generateTime: Date.now() - startTime
		};
	} finally {
		await session.close();
	}
}
async function generatePdfBasic(options) {
	const startTime = Date.now();
	const pdfContent = createBasicPdf(options);
	return {
		pdf: new TextEncoder().encode(pdfContent).buffer.slice(0),
		generateTime: Date.now() - startTime
	};
}
function createBasicPdf(options) {
	const title = options.metadata?.title || "Document";
	const author = options.metadata?.author || "Conductor";
	const creationDate = options.metadata?.creationDate || /* @__PURE__ */ new Date();
	const textContent = options.html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
	return `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
/Metadata 3 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [4 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Metadata
/Subtype /XML
/Length 0
>>
stream
endstream
endobj

4 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 595 842]
/Contents 5 0 R
/Resources <<
/Font <<
/F1 6 0 R
>>
>>
>>
endobj

5 0 obj
<<
/Length ${textContent.length + 50}
>>
stream
BT
/F1 12 Tf
50 800 Td
(${title}) Tj
0 -20 Td
(${textContent.substring(0, 500)}) Tj
ET
endstream
endobj

6 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 7
0000000000 65535 f
0000000009 00000 n
0000000074 00000 n
0000000131 00000 n
0000000229 00000 n
0000000379 00000 n
0000000${(500 + textContent.length).toString().padStart(3, "0")} 00000 n
trailer
<<
/Size 7
/Root 1 0 R
/Info <<
/Title (${title})
/Author (${author})
/CreationDate (D:${formatPdfDate(creationDate)})
>>
>>
startxref
${(550 + textContent.length).toString()}
%%EOF`;
}
function formatPdfDate(date$1) {
	return `${date$1.getFullYear()}${String(date$1.getMonth() + 1).padStart(2, "0")}${String(date$1.getDate()).padStart(2, "0")}${String(date$1.getHours()).padStart(2, "0")}${String(date$1.getMinutes()).padStart(2, "0")}${String(date$1.getSeconds()).padStart(2, "0")}`;
}
function validatePageConfig(page) {
	const errors = [];
	if (page?.scale && (page.scale < .1 || page.scale > 2)) errors.push("Scale must be between 0.1 and 2.0");
	if (page?.margins) {
		const { top, right, bottom, left } = page.margins;
		if (top && top < 0) errors.push("Top margin cannot be negative");
		if (right && right < 0) errors.push("Right margin cannot be negative");
		if (bottom && bottom < 0) errors.push("Bottom margin cannot be negative");
		if (left && left < 0) errors.push("Left margin cannot be negative");
	}
	return {
		valid: errors.length === 0,
		errors: errors.length > 0 ? errors : void 0
	};
}
async function storePdfToR2(pdf, config, env) {
	const r2BindingName = config.r2Binding || "ASSETS";
	const bucket = env[r2BindingName];
	if (!bucket) throw new Error(`R2 bucket binding "${r2BindingName}" not found in environment`);
	const r2Key = config.r2Key || generateDefaultR2Key();
	await bucket.put(r2Key, pdf, {
		httpMetadata: { contentType: "application/pdf" },
		customMetadata: {
			uploadedAt: (/* @__PURE__ */ new Date()).toISOString(),
			generatedBy: "conductor-pdf-agent"
		}
	});
	let url;
	if (config.publicUrl) url = `/assets/static/${r2Key.split("/").pop()}`;
	return {
		r2Key,
		url
	};
}
function generateDefaultR2Key() {
	return `static/generated-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.pdf`;
}
function generateFilename(r2Key, configFilename, fallback$1 = "document.pdf") {
	if (configFilename) return configFilename.endsWith(".pdf") ? configFilename : `${configFilename}.pdf`;
	if (r2Key) {
		const parts = r2Key.split("/");
		return parts[parts.length - 1] || fallback$1;
	}
	return fallback$1;
}
function createContentDisposition(mode, filename) {
	const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
	if (mode === "attachment") return `attachment; filename="${safeFilename}"`;
	return `inline; filename="${safeFilename}"`;
}
function validateStorageConfig(config) {
	if (!config || !config.saveToR2) return { valid: true };
	const errors = [];
	if (config.r2Key) {
		if (config.r2Key.includes("..")) errors.push("R2 key cannot contain \"..\"");
		if (config.r2Key.startsWith("/")) errors.push("R2 key should not start with \"/\"");
	}
	return {
		valid: errors.length === 0,
		errors: errors.length > 0 ? errors : void 0
	};
}
init_base_agent();
var PdfMember = class extends BaseAgent {
	constructor(config) {
		super(config);
		this.pdfConfig = config;
		this.templateEngine = createTemplateEngine(this.pdfConfig.templateEngine || "simple");
		this.validateConfig();
	}
	validateConfig() {
		if (this.pdfConfig.page) {
			const pageValidation = validatePageConfig(this.pdfConfig.page);
			if (!pageValidation.valid) throw new Error(`Invalid page config: ${pageValidation.errors?.join(", ")}`);
		}
		if (this.pdfConfig.storage) {
			const storageValidation = validateStorageConfig(this.pdfConfig.storage);
			if (!storageValidation.valid) throw new Error(`Invalid storage config: ${storageValidation.errors?.join(", ")}`);
		}
	}
	async run(context) {
		const startTime = Date.now();
		const input = context.input;
		const htmlSource = input.html || this.pdfConfig.html;
		const pageConfig = {
			...this.pdfConfig.page,
			...input.page
		};
		const headerFooter = {
			...this.pdfConfig.headerFooter,
			...input.headerFooter
		};
		const storageConfig = {
			...this.pdfConfig.storage,
			...input.storage
		};
		const metadata = {
			...this.pdfConfig.metadata,
			...input.metadata
		};
		const deliveryMode = input.deliveryMode || this.pdfConfig.deliveryMode || "inline";
		const filename = input.filename || this.pdfConfig.filename;
		let html;
		let htmlSize;
		if (htmlSource?.inline) {
			html = htmlSource.inline;
			htmlSize = html.length;
		} else if (htmlSource?.fromMember) {
			const memberOutput = context.previousOutputs?.[htmlSource.fromMember];
			if (!memberOutput?.output?.html) throw new Error(`Agent "${htmlSource.fromMember}" did not produce HTML output. Make sure it's an HTML agent and executed before this PDF agent.`);
			html = memberOutput.output.html;
			htmlSize = html.length;
		} else if (htmlSource?.template) {
			const htmlMember = new HtmlMember({
				name: `${this.name}-html-renderer`,
				operation: Operation.html,
				config: {
					template: htmlSource.template,
					templateEngine: this.pdfConfig.templateEngine || "simple",
					renderOptions: {
						inlineCss: false,
						minify: false
					}
				}
			});
			const htmlContext = {
				input: { data: htmlSource.data || {} },
				env: context.env,
				ctx: context.ctx,
				previousOutputs: context.previousOutputs
			};
			const htmlResponse = await htmlMember.execute(htmlContext);
			if (!htmlResponse.success) throw new Error(`HTML rendering failed: ${htmlResponse.error}`);
			html = htmlResponse.data.html;
			htmlSize = html.length;
		} else throw new Error("No HTML source specified. Provide html.inline, html.fromMember, or html.template");
		const renderedHeaderFooter = await this.renderHeaderFooter(headerFooter);
		const pdfResult = await generatePdf({
			html,
			page: pageConfig,
			headerFooter: renderedHeaderFooter,
			metadata
		}, context.env);
		let r2Key;
		let url;
		if (storageConfig?.saveToR2) {
			const storageResult = await storePdfToR2(pdfResult.pdf, storageConfig, context.env);
			r2Key = storageResult.r2Key;
			url = storageResult.url;
		}
		const finalFilename = generateFilename(r2Key, filename, "document.pdf");
		const contentDisposition = createContentDisposition(deliveryMode, finalFilename);
		return {
			pdf: pdfResult.pdf,
			size: pdfResult.pdf.byteLength,
			url,
			r2Key,
			contentDisposition,
			filename: finalFilename,
			metadata: {
				generateTime: Date.now() - startTime,
				pageCount: pdfResult.pageCount,
				htmlSize
			}
		};
	}
	async renderHeaderFooter(headerFooter) {
		if (!headerFooter) return;
		const data = headerFooter.data || {};
		const rendered = { ...headerFooter };
		if (headerFooter.header) rendered.header = await this.templateEngine.render(headerFooter.header, data);
		if (headerFooter.footer) rendered.footer = await this.templateEngine.render(headerFooter.footer, data);
		return rendered;
	}
};
init_base_agent();
var DocsMember = class extends BaseAgent {
	constructor(config) {
		super(config);
		this.docsConfig = config;
		this.docsConfig.ui = this.docsConfig.ui || "stoplight";
		this.docsConfig.openApiVersion = this.docsConfig.openApiVersion || "3.1";
		this.docsConfig.paths = this.docsConfig.paths || {
			docs: "/docs",
			yaml: "/openapi.yaml",
			json: "/openapi.json"
		};
	}
	async run(context) {
		const input = context.input;
		const pathname = new URL(input.request?.url || "").pathname;
		if (this.docsConfig.cache?.enabled) {
			const cached = await this.checkCache(pathname, context);
			if (cached) return cached;
		}
		if (pathname === this.docsConfig.paths?.docs) return await this.serveDocsUI(context);
		else if (pathname === this.docsConfig.paths?.yaml) return await this.serveSpec("yaml", context);
		else if (pathname === this.docsConfig.paths?.json) return await this.serveSpec("json", context);
		return {
			content: "Not Found",
			contentType: "text/plain",
			status: 404,
			headers: {}
		};
	}
	async serveDocsUI(context) {
		const ui = this.docsConfig.ui;
		const branding = this.docsConfig.branding;
		const specUrl = this.docsConfig.paths.yaml;
		let html = "";
		switch (ui) {
			case "stoplight":
				html = this.generateStoplightUI(specUrl, branding);
				break;
			case "redoc":
				html = this.generateRedocUI(specUrl, branding);
				break;
			case "swagger":
				html = this.generateSwaggerUI(specUrl, branding);
				break;
			case "scalar":
				html = this.generateScalarUI(specUrl, branding);
				break;
			case "rapidoc":
				html = this.generateRapidocUI(specUrl, branding);
				break;
			default: html = this.generateStoplightUI(specUrl, branding);
		}
		const output = {
			content: html,
			contentType: "text/html; charset=utf-8",
			status: 200,
			headers: { "Cache-Control": this.docsConfig.cache?.enabled ? `public, max-age=${this.docsConfig.cache.ttl}` : "no-cache" },
			cacheStatus: "miss"
		};
		if (this.docsConfig.cache?.enabled) await this.cacheOutput(this.docsConfig.paths.docs, output, context);
		return output;
	}
	async serveSpec(format$1, context) {
		const spec = await this.generateSpec(context);
		let content;
		let contentType;
		if (format$1 === "yaml") {
			content = JSON.stringify(spec, null, 2);
			contentType = "application/x-yaml";
		} else {
			content = JSON.stringify(spec, null, 2);
			contentType = "application/json";
		}
		const output = {
			content,
			contentType,
			status: 200,
			headers: { "Cache-Control": this.docsConfig.cache?.enabled ? `public, max-age=${this.docsConfig.cache.ttl}` : "no-cache" },
			cacheStatus: "miss"
		};
		if (this.docsConfig.cache?.enabled) {
			const path$1 = format$1 === "yaml" ? this.docsConfig.paths.yaml : this.docsConfig.paths.json;
			await this.cacheOutput(path$1, output, context);
		}
		return output;
	}
	async generateSpec(context) {
		if (this.docsConfig.customSpec) return this.docsConfig.customSpec;
		if (this.docsConfig.autoGenerate?.enabled) return await this.autoGenerateSpec(context);
		return {
			openapi: "3.1.0",
			info: {
				title: this.docsConfig.branding?.title || "API Documentation",
				description: this.docsConfig.branding?.description || "API Documentation",
				version: "1.0.0"
			},
			servers: this.docsConfig.servers || [{
				url: "/",
				description: "Current server"
			}],
			paths: {}
		};
	}
	async autoGenerateSpec(context) {
		return {
			openapi: "3.1.0",
			info: {
				title: this.docsConfig.branding?.title || "API Documentation",
				description: this.docsConfig.branding?.description || "Auto-generated API documentation",
				version: "1.0.0"
			},
			servers: this.docsConfig.servers || [],
			paths: { "/api/v1/execute": { post: {
				summary: "Execute an ensemble",
				description: "Execute a named ensemble with input data",
				requestBody: {
					required: true,
					content: { "application/json": { schema: {
						type: "object",
						properties: {
							ensemble: { type: "string" },
							input: { type: "object" }
						}
					} } }
				},
				responses: { "200": {
					description: "Execution result",
					content: { "application/json": { schema: {
						type: "object",
						properties: {
							success: { type: "boolean" },
							result: { type: "object" }
						}
					} } }
				} }
			} } }
		};
	}
	generateStoplightUI(specUrl, branding) {
		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${branding?.title || "API Documentation"}</title>
	${branding?.favicon ? `<link rel="icon" href="${branding.favicon}">` : ""}
	<script src="https://unpkg.com/@stoplight/elements/web-components.min.js"><\/script>
	<link rel="stylesheet" href="https://unpkg.com/@stoplight/elements/styles.min.css">
	${branding?.customCss ? `<style>${branding.customCss}</style>` : ""}
</head>
<body>
	<elements-api
		apiDescriptionUrl="${specUrl}"
		router="hash"
		layout="sidebar"
		${branding?.logo ? `logo="${branding.logo}"` : ""}
	/>
</body>
</html>`;
	}
	generateRedocUI(specUrl, branding) {
		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${branding?.title || "API Documentation"}</title>
	${branding?.favicon ? `<link rel="icon" href="${branding.favicon}">` : ""}
	<style>
		body { margin: 0; padding: 0; }
		${branding?.customCss || ""}
	</style>
</head>
<body>
	<redoc spec-url="${specUrl}"></redoc>
	<script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"><\/script>
</body>
</html>`;
	}
	generateSwaggerUI(specUrl, branding) {
		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${branding?.title || "API Documentation"}</title>
	${branding?.favicon ? `<link rel="icon" href="${branding.favicon}">` : ""}
	<link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@latest/swagger-ui.css">
	<style>
		body { margin: 0; }
		${branding?.customCss || ""}
	</style>
</head>
<body>
	<div id="swagger-ui"></div>
	<script src="https://unpkg.com/swagger-ui-dist@latest/swagger-ui-bundle.js"><\/script>
	<script>
		window.onload = () => {
			SwaggerUIBundle({
				url: '${specUrl}',
				dom_id: '#swagger-ui',
			});
		};
	<\/script>
</body>
</html>`;
	}
	generateScalarUI(specUrl, branding) {
		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${branding?.title || "API Documentation"}</title>
	${branding?.favicon ? `<link rel="icon" href="${branding.favicon}">` : ""}
	<style>
		body { margin: 0; }
		${branding?.customCss || ""}
	</style>
</head>
<body>
	<script
		id="api-reference"
		data-url="${specUrl}"
		${branding?.theme ? `data-theme="${branding.theme}"` : ""}
	><\/script>
	<script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"><\/script>
</body>
</html>`;
	}
	generateRapidocUI(specUrl, branding) {
		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${branding?.title || "API Documentation"}</title>
	${branding?.favicon ? `<link rel="icon" href="${branding.favicon}">` : ""}
	<script type="module" src="https://unpkg.com/rapidoc/dist/rapidoc-min.js"><\/script>
	<style>
		${branding?.customCss || ""}
	</style>
</head>
<body>
	<rapi-doc
		spec-url="${specUrl}"
		render-style="read"
		${branding?.primaryColor ? `theme="dark" primary-color="${branding.primaryColor}"` : ""}
		${branding?.logo ? `logo="${branding.logo}"` : ""}
	></rapi-doc>
</body>
</html>`;
	}
	async checkCache(path$1, context) {
		if (!this.docsConfig.cache?.enabled) return null;
		const cacheKey = `docs:${this.name}:${path$1}`;
		const cached = await context.env.DOCS_CACHE?.get(cacheKey, "json");
		if (cached) return {
			...cached,
			cacheStatus: "hit"
		};
		return null;
	}
	async cacheOutput(path$1, output, context) {
		if (!this.docsConfig.cache?.enabled) return;
		const cacheKey = `docs:${this.name}:${path$1}`;
		const ttl = this.docsConfig.cache.ttl || 300;
		await context.env.DOCS_CACHE?.put(cacheKey, JSON.stringify(output), { expirationTtl: ttl });
	}
};
function detectBotProtection(content) {
	const reasons = [];
	const lowercaseContent = content.toLowerCase();
	if (content.length < MIN_CONTENT_LENGTH) reasons.push(`Content too short (${content.length} < ${MIN_CONTENT_LENGTH})`);
	for (const keyword of BOT_PROTECTION_KEYWORDS) if (lowercaseContent.includes(keyword)) reasons.push(`Contains bot protection keyword: "${keyword}"`);
	return {
		detected: reasons.length > 0,
		reasons
	};
}
function isContentSuccessful(content) {
	return !detectBotProtection(content).detected;
}
var BOT_PROTECTION_KEYWORDS, MIN_CONTENT_LENGTH;
var init_bot_detection = __esmMin((() => {
	BOT_PROTECTION_KEYWORDS = [
		"cloudflare",
		"just a moment",
		"checking your browser",
		"please wait",
		"access denied",
		"captcha",
		"recaptcha",
		"challenge",
		"verify you are human",
		"attention required",
		"enable javascript",
		"blocked"
	];
	MIN_CONTENT_LENGTH = 800;
}));
function extractTextFromHTML(html) {
	let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
	text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
	text = text.replace(/<[^>]+>/g, " ");
	text = text.replace(/&nbsp;/g, " ");
	text = text.replace(/&amp;/g, "&");
	text = text.replace(/&lt;/g, "<");
	text = text.replace(/&gt;/g, ">");
	text = text.replace(/&quot;/g, "\"");
	text = text.replace(/&#39;/g, "'");
	text = text.replace(/\s+/g, " ");
	text = text.trim();
	return text;
}
function extractTitleFromHTML(html) {
	const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
	if (titleMatch && titleMatch[1]) return titleMatch[1].trim();
	return "";
}
function convertHTMLToMarkdown(html) {
	let markdown = html;
	const title = extractTitleFromHTML(html);
	markdown = markdown.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
	markdown = markdown.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
	markdown = markdown.replace(/<h1[^>]*>([^<]+)<\/h1>/gi, "\n# $1\n");
	markdown = markdown.replace(/<h2[^>]*>([^<]+)<\/h2>/gi, "\n## $1\n");
	markdown = markdown.replace(/<h3[^>]*>([^<]+)<\/h3>/gi, "\n### $1\n");
	markdown = markdown.replace(/<h4[^>]*>([^<]+)<\/h4>/gi, "\n#### $1\n");
	markdown = markdown.replace(/<h5[^>]*>([^<]+)<\/h5>/gi, "\n##### $1\n");
	markdown = markdown.replace(/<h6[^>]*>([^<]+)<\/h6>/gi, "\n###### $1\n");
	markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/gi, "[$2]($1)");
	markdown = markdown.replace(/<(strong|b)[^>]*>([^<]+)<\/(strong|b)>/gi, "**$2**");
	markdown = markdown.replace(/<(em|i)[^>]*>([^<]+)<\/(em|i)>/gi, "*$2*");
	markdown = markdown.replace(/<li[^>]*>([^<]+)<\/li>/gi, "- $1\n");
	markdown = markdown.replace(/<p[^>]*>([^<]+)<\/p>/gi, "\n$1\n");
	markdown = markdown.replace(/<[^>]+>/g, "");
	markdown = markdown.replace(/&nbsp;/g, " ");
	markdown = markdown.replace(/&amp;/g, "&");
	markdown = markdown.replace(/&lt;/g, "<");
	markdown = markdown.replace(/&gt;/g, ">");
	markdown = markdown.replace(/&quot;/g, "\"");
	markdown = markdown.replace(/&#39;/g, "'");
	markdown = markdown.replace(/\n{3,}/g, "\n\n");
	markdown = markdown.replace(/[ \t]+/g, " ");
	markdown = markdown.trim();
	if (title) markdown = `# ${title}\n\n${markdown}`;
	return markdown;
}
var init_html_parser = __esmMin((() => {}));
var logger$5, ScrapeMember;
var init_scrape_agent = __esmMin((() => {
	init_base_agent();
	init_bot_detection();
	init_html_parser();
	init_observability();
	logger$5 = createLogger({ serviceName: "scrape-agent" });
	ScrapeMember = class extends BaseAgent {
		constructor(config, env) {
			super(config);
			this.env = env;
			const cfg = config.config;
			this.scrapeConfig = {
				strategy: cfg?.strategy || "balanced",
				returnFormat: cfg?.returnFormat || "markdown",
				blockResources: cfg?.blockResources !== false,
				userAgent: cfg?.userAgent,
				timeout: cfg?.timeout || 3e4
			};
		}
		async run(context) {
			const input = context.input;
			if (!input.url) throw new Error("Scrape agent requires \"url\" in input");
			const startTime = Date.now();
			const strategy = this.scrapeConfig.strategy;
			try {
				const result$1 = await this.tier1Fast(input.url);
				if (isContentSuccessful(result$1.html)) return this.formatResult(result$1, 1, Date.now() - startTime);
			} catch (error) {
				logger$5.debug("Tier 1 fast scrape failed, trying Tier 2", {
					url: input.url,
					error: error instanceof Error ? error.message : "Unknown error"
				});
			}
			if (strategy === "fast") return this.fallbackResult(input.url, Date.now() - startTime);
			try {
				const result$1 = await this.tier2Slow(input.url);
				if (isContentSuccessful(result$1.html)) return this.formatResult(result$1, 2, Date.now() - startTime);
			} catch (error) {
				logger$5.debug("Tier 2 slow scrape failed, trying Tier 3", {
					url: input.url,
					error: error instanceof Error ? error.message : "Unknown error"
				});
			}
			if (strategy === "balanced") return this.fallbackResult(input.url, Date.now() - startTime);
			const result = await this.tier3HTMLParsing(input.url);
			return this.formatResult(result, 3, Date.now() - startTime);
		}
		async tier1Fast(url) {
			const response = await fetch(url, {
				headers: { "User-Agent": this.scrapeConfig.userAgent || "Mozilla/5.0 (compatible; Conductor/1.0)" },
				signal: AbortSignal.timeout(this.scrapeConfig.timeout)
			});
			if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			const html = await response.text();
			return {
				html,
				title: extractTitleFromHTML(html)
			};
		}
		async tier2Slow(url) {
			return await this.tier1Fast(url);
		}
		async tier3HTMLParsing(url) {
			const response = await fetch(url, {
				headers: { "User-Agent": this.scrapeConfig.userAgent || "Mozilla/5.0 (compatible; Conductor/1.0)" },
				signal: AbortSignal.timeout(this.scrapeConfig.timeout)
			});
			if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			const html = await response.text();
			return {
				html,
				title: extractTitleFromHTML(html)
			};
		}
		formatResult(data, tier, duration) {
			const botProtection = detectBotProtection(data.html);
			const format$1 = this.scrapeConfig.returnFormat;
			const result = {
				url: "",
				tier,
				duration,
				botProtectionDetected: botProtection.detected,
				contentLength: data.html.length,
				title: data.title
			};
			if (format$1 === "html" || format$1 === "markdown") result.html = data.html;
			if (format$1 === "markdown") result.markdown = convertHTMLToMarkdown(data.html);
			if (format$1 === "text") result.text = extractTextFromHTML(data.html);
			return result;
		}
		fallbackResult(url, duration) {
			return {
				url,
				tier: 3,
				duration,
				botProtectionDetected: true,
				contentLength: 0,
				markdown: "",
				html: "",
				text: ""
			};
		}
	};
}));
var scrape_exports = /* @__PURE__ */ __export({
	ScrapeMember: () => ScrapeMember,
	convertHTMLToMarkdown: () => convertHTMLToMarkdown,
	detectBotProtection: () => detectBotProtection,
	extractTextFromHTML: () => extractTextFromHTML,
	extractTitleFromHTML: () => extractTitleFromHTML,
	isContentSuccessful: () => isContentSuccessful
});
var init_scrape = __esmMin((() => {
	init_scrape_agent();
	init_bot_detection();
	init_html_parser();
}));
var BaseEvaluator;
var init_base_evaluator = __esmMin((() => {
	BaseEvaluator = class {
		normalizeScore(score, min = 0, max = 1) {
			return Math.max(min, Math.min(max, score));
		}
		calculateWeightedAverage(scores, weights) {
			let totalWeight = 0;
			let weightedSum = 0;
			for (const [key, score] of Object.entries(scores)) {
				const weight = weights[key] || 1;
				weightedSum += score * weight;
				totalWeight += weight;
			}
			return totalWeight > 0 ? weightedSum / totalWeight : 0;
		}
	};
}));
var RuleEvaluator;
var init_rule_evaluator = __esmMin((() => {
	init_base_evaluator();
	RuleEvaluator = class extends BaseEvaluator {
		async evaluate(content, config) {
			const rules = config.rules || [];
			if (rules.length === 0) throw new Error("Rule evaluator requires at least one rule in config");
			const breakdown = {};
			const weights = {};
			const details = {};
			for (const rule of rules) try {
				const context = {
					content,
					length: content.length,
					wordCount: content.split(/\s+/).length,
					lineCount: content.split("\n").length
				};
				const result = this.evaluateRule(rule.check, context);
				const score = result ? 1 : 0;
				breakdown[rule.name] = score;
				weights[rule.name] = rule.weight;
				details[rule.name] = {
					passed: result,
					rule: rule.check,
					description: rule.description
				};
			} catch (error) {
				breakdown[rule.name] = 0;
				weights[rule.name] = rule.weight;
				details[rule.name] = {
					passed: false,
					error: error instanceof Error ? error.message : "Unknown error"
				};
			}
			return {
				average: this.calculateWeightedAverage(breakdown, weights),
				breakdown,
				details
			};
		}
		evaluateRule(expression, context) {
			let evalExpression = expression;
			evalExpression = evalExpression.replace(/content\.length/g, String(context.content.length));
			evalExpression = evalExpression.replace(/content\.wordCount/g, String(context.wordCount));
			evalExpression = evalExpression.replace(/content\.lineCount/g, String(context.lineCount));
			evalExpression = evalExpression.replace(/content\.includes\(['"]([^'"]+)['"]\)/g, (match, keyword) => {
				return String(context.content.toLowerCase().includes(keyword.toLowerCase()));
			});
			try {
				const fn = new Function("return (" + evalExpression + ")");
				return Boolean(fn());
			} catch (error) {
				return false;
			}
		}
	};
}));
var JudgeEvaluator;
var init_judge_evaluator = __esmMin((() => {
	init_base_evaluator();
	JudgeEvaluator = class extends BaseEvaluator {
		async evaluate(content, config) {
			const criteria = config.criteria || [];
			const model = config.model || "claude-3-5-haiku-20241022";
			if (criteria.length === 0) throw new Error("Judge evaluator requires at least one criterion in config");
			const breakdown = {};
			const weights = {};
			for (const criterion of criteria) {
				breakdown[criterion.name] = .75;
				weights[criterion.name] = criterion.weight;
			}
			return {
				average: this.calculateWeightedAverage(breakdown, weights),
				breakdown,
				details: {
					model,
					criteria: criteria.map((c) => c.name),
					note: "LLM-based evaluation not yet implemented"
				}
			};
		}
	};
}));
var NLPEvaluator;
var init_nlp_evaluator = __esmMin((() => {
	init_base_evaluator();
	NLPEvaluator = class extends BaseEvaluator {
		async evaluate(content, config) {
			const reference = config.reference;
			if (!reference) throw new Error("NLP evaluator requires \"reference\" text in config");
			const metrics = config.metrics || ["bleu", "rouge"];
			const breakdown = {};
			for (const metric of metrics) switch (metric.toLowerCase()) {
				case "bleu":
					breakdown.bleu = this.calculateBLEU(content, reference);
					break;
				case "rouge":
					breakdown.rouge = this.calculateROUGE(content, reference);
					break;
				case "length-ratio":
					breakdown.lengthRatio = this.calculateLengthRatio(content, reference);
					break;
				default: breakdown[metric] = 0;
			}
			return {
				average: Object.values(breakdown).reduce((sum$1, score) => sum$1 + score, 0) / Object.keys(breakdown).length,
				breakdown,
				details: {
					reference: reference.substring(0, 100) + "...",
					contentLength: content.length,
					referenceLength: reference.length
				}
			};
		}
		calculateBLEU(candidate, reference) {
			const candidateWords = candidate.toLowerCase().split(/\s+/);
			const referenceWords = reference.toLowerCase().split(/\s+/);
			const referenceSet = new Set(referenceWords);
			let matches = 0;
			for (const word of candidateWords) if (referenceSet.has(word)) matches++;
			const precision = candidateWords.length > 0 ? matches / candidateWords.length : 0;
			return this.normalizeScore(precision);
		}
		calculateROUGE(candidate, reference) {
			const candidateWords = candidate.toLowerCase().split(/\s+/);
			const referenceWords = reference.toLowerCase().split(/\s+/);
			const lcs = this.longestCommonSubsequence(candidateWords, referenceWords);
			const recall = referenceWords.length > 0 ? lcs / referenceWords.length : 0;
			const precision = candidateWords.length > 0 ? lcs / candidateWords.length : 0;
			const f1 = recall + precision > 0 ? 2 * recall * precision / (recall + precision) : 0;
			return this.normalizeScore(f1);
		}
		calculateLengthRatio(candidate, reference) {
			const ratio = Math.min(candidate.length, reference.length) / Math.max(candidate.length, reference.length);
			return this.normalizeScore(ratio);
		}
		longestCommonSubsequence(arr1, arr2) {
			const m = arr1.length;
			const n = arr2.length;
			const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
			for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) if (arr1[i - 1] === arr2[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
			else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
			return dp[m][n];
		}
	};
}));
var EmbeddingEvaluator;
var init_embedding_evaluator = __esmMin((() => {
	init_base_evaluator();
	EmbeddingEvaluator = class extends BaseEvaluator {
		async evaluate(content, config) {
			const reference = config.reference;
			if (!reference) throw new Error("Embedding evaluator requires \"reference\" text in config");
			const model = config.model || "@cf/baai/bge-base-en-v1.5";
			const similarity = this.calculateSimpleTextSimilarity(content, reference);
			return {
				average: similarity,
				breakdown: { semanticSimilarity: similarity },
				details: {
					model,
					note: "Using simple text similarity as placeholder for embedding-based similarity"
				}
			};
		}
		calculateSimpleTextSimilarity(text1, text2) {
			const words1 = new Set(text1.toLowerCase().split(/\s+/));
			const words2 = new Set(text2.toLowerCase().split(/\s+/));
			const intersection = new Set([...words1].filter((x) => words2.has(x)));
			const union = new Set([...words1, ...words2]);
			return union.size > 0 ? intersection.size / union.size : 0;
		}
		cosineSimilarity(vec1, vec2) {
			if (vec1.length !== vec2.length) throw new Error("Vectors must have the same length");
			let dotProduct = 0;
			let norm1 = 0;
			let norm2 = 0;
			for (let i = 0; i < vec1.length; i++) {
				dotProduct += vec1[i] * vec2[i];
				norm1 += vec1[i] * vec1[i];
				norm2 += vec2[i] * vec2[i];
			}
			norm1 = Math.sqrt(norm1);
			norm2 = Math.sqrt(norm2);
			if (norm1 === 0 || norm2 === 0) return 0;
			return dotProduct / (norm1 * norm2);
		}
	};
}));
var ValidateMember;
var init_validate_agent = __esmMin((() => {
	init_base_agent();
	init_rule_evaluator();
	init_judge_evaluator();
	init_nlp_evaluator();
	init_embedding_evaluator();
	ValidateMember = class extends BaseAgent {
		constructor(config, env) {
			super(config);
			this.env = env;
			const cfg = config.config;
			this.validateConfig = {
				evalType: cfg?.evalType || "rule",
				threshold: cfg?.threshold !== void 0 ? cfg.threshold : .7,
				rules: cfg?.rules,
				criteria: cfg?.criteria,
				metrics: cfg?.metrics,
				reference: cfg?.reference,
				model: cfg?.model
			};
		}
		async run(context) {
			const input = context.input;
			if (!input.content) throw new Error("Validate agent requires \"content\" in input");
			const evalType = this.validateConfig.evalType;
			const evaluator = this.getEvaluator(evalType);
			const evalConfig = {
				...this.validateConfig,
				reference: input.reference || this.validateConfig.reference
			};
			const scores = await evaluator.evaluate(input.content, evalConfig);
			const threshold = this.validateConfig.threshold;
			return {
				passed: scores.average >= threshold,
				score: scores.average,
				scores: scores.breakdown,
				details: scores.details || {},
				evalType
			};
		}
		getEvaluator(type) {
			switch (type) {
				case "rule": return new RuleEvaluator();
				case "judge": return new JudgeEvaluator();
				case "nlp": return new NLPEvaluator();
				case "embedding": return new EmbeddingEvaluator();
				default: throw new Error(`Unknown evaluator type: ${type}`);
			}
		}
	};
}));
var validate_exports = /* @__PURE__ */ __export({
	BaseEvaluator: () => BaseEvaluator,
	EmbeddingEvaluator: () => EmbeddingEvaluator,
	JudgeEvaluator: () => JudgeEvaluator,
	NLPEvaluator: () => NLPEvaluator,
	RuleEvaluator: () => RuleEvaluator,
	ValidateMember: () => ValidateMember
});
var init_validate = __esmMin((() => {
	init_validate_agent();
	init_base_evaluator();
	init_rule_evaluator();
	init_judge_evaluator();
	init_nlp_evaluator();
	init_embedding_evaluator();
}));
var Chunker;
var init_chunker = __esmMin((() => {
	Chunker = class {
		chunk(text, strategy, chunkSize, overlap) {
			switch (strategy) {
				case "fixed": return this.fixedSizeChunking(text, chunkSize, overlap);
				case "semantic": return this.semanticChunking(text, chunkSize, overlap);
				case "recursive": return this.recursiveChunking(text, chunkSize, overlap);
				default: return this.fixedSizeChunking(text, chunkSize, overlap);
			}
		}
		fixedSizeChunking(text, chunkSize, overlap) {
			const chunks = [];
			const words = text.split(/\s+/);
			for (let i = 0; i < words.length; i += chunkSize - overlap) {
				const chunkText = words.slice(i, i + chunkSize).join(" ");
				chunks.push({
					text: chunkText,
					index: chunks.length
				});
				if (i + chunkSize >= words.length) break;
			}
			return chunks;
		}
		semanticChunking(text, chunkSize, overlap) {
			const chunks = [];
			const paragraphs = text.split(/\n\n+/);
			let currentChunk = [];
			let currentSize = 0;
			for (const paragraph of paragraphs) {
				const paragraphSize = paragraph.split(/\s+/).length;
				if (currentSize + paragraphSize > chunkSize && currentChunk.length > 0) {
					chunks.push({
						text: currentChunk.join("\n\n"),
						index: chunks.length
					});
					if (overlap > 0 && currentChunk.length > 0) {
						const lastParagraph = currentChunk[currentChunk.length - 1];
						currentChunk = [lastParagraph, paragraph];
						currentSize = lastParagraph.split(/\s+/).length + paragraphSize;
					} else {
						currentChunk = [paragraph];
						currentSize = paragraphSize;
					}
				} else {
					currentChunk.push(paragraph);
					currentSize += paragraphSize;
				}
			}
			if (currentChunk.length > 0) chunks.push({
				text: currentChunk.join("\n\n"),
				index: chunks.length
			});
			return chunks;
		}
		recursiveChunking(text, chunkSize, overlap) {
			return this.recursiveChunkingHelper(text, chunkSize, overlap, [
				"\n\n",
				"\n",
				". ",
				" "
			], 0);
		}
		recursiveChunkingHelper(text, chunkSize, overlap, separators, depth) {
			if (text.split(/\s+/).length <= chunkSize) return [{
				text,
				index: 0
			}];
			if (depth >= separators.length) return this.fixedSizeChunking(text, chunkSize, overlap);
			const separator = separators[depth];
			const parts = text.split(separator);
			const chunks = [];
			let currentChunk = [];
			let currentSize = 0;
			for (const part of parts) {
				const partSize = part.split(/\s+/).length;
				if (currentSize + partSize > chunkSize && currentChunk.length > 0) {
					const chunkText = currentChunk.join(separator);
					const subChunks = this.recursiveChunkingHelper(chunkText, chunkSize, overlap, separators, depth + 1);
					chunks.push(...subChunks.map((chunk, i) => ({
						...chunk,
						index: chunks.length + i
					})));
					currentChunk = [part];
					currentSize = partSize;
				} else {
					currentChunk.push(part);
					currentSize += partSize;
				}
			}
			if (currentChunk.length > 0) {
				const chunkText = currentChunk.join(separator);
				const subChunks = this.recursiveChunkingHelper(chunkText, chunkSize, overlap, separators, depth + 1);
				chunks.push(...subChunks.map((chunk, i) => ({
					...chunk,
					index: chunks.length + i
				})));
			}
			return chunks;
		}
	};
}));
var RAGMember;
var init_rag_agent = __esmMin((() => {
	init_base_agent();
	init_chunker();
	RAGMember = class extends BaseAgent {
		constructor(config, env) {
			super(config);
			this.env = env;
			const cfg = config.config;
			this.ragConfig = {
				operation: cfg?.operation || "search",
				chunkStrategy: cfg?.chunkStrategy || "semantic",
				chunkSize: cfg?.chunkSize || 512,
				overlap: cfg?.overlap || 50,
				embeddingModel: cfg?.embeddingModel || "@cf/baai/bge-base-en-v1.5",
				topK: cfg?.topK || 5,
				rerank: cfg?.rerank || false,
				rerankAlgorithm: cfg?.rerankAlgorithm || "cross-encoder"
			};
			this.chunker = new Chunker();
		}
		async run(context) {
			const input = context.input;
			const operation = this.ragConfig.operation;
			switch (operation) {
				case "index": return await this.indexContent(input);
				case "search": return await this.searchContent(input);
				default: throw new Error(`Unknown RAG operation: ${operation}`);
			}
		}
		async indexContent(input) {
			if (!input.content) throw new Error("Index operation requires \"content\" in input");
			if (!input.id) throw new Error("Index operation requires \"id\" in input");
			const chunks = this.chunker.chunk(input.content, this.ragConfig.chunkStrategy, this.ragConfig.chunkSize, this.ragConfig.overlap);
			return {
				indexed: chunks.length,
				chunks: chunks.length,
				embeddingModel: this.ragConfig.embeddingModel,
				chunkStrategy: this.ragConfig.chunkStrategy
			};
		}
		async searchContent(input) {
			if (!input.query) throw new Error("Search operation requires \"query\" in input");
			return {
				results: [],
				count: 0,
				reranked: this.ragConfig.rerank
			};
		}
		async generateEmbeddings(chunks) {
			return chunks.map(() => Array(384).fill(0));
		}
		async generateEmbedding(text) {
			return Array(384).fill(0);
		}
		async storeInVectorize(docId, chunks, embeddings, metadata) {}
		async searchVectorize(queryEmbedding, filter$1) {
			return [];
		}
		async rerank(query, results) {
			return results;
		}
	};
}));
var rag_exports = /* @__PURE__ */ __export({
	Chunker: () => Chunker,
	RAGMember: () => RAGMember
});
var init_rag = __esmMin((() => {
	init_rag_agent();
	init_chunker();
}));
var logger$4, HITLMember;
var init_hitl_agent = __esmMin((() => {
	init_base_agent();
	init_observability();
	logger$4 = createLogger({ serviceName: "hitl-agent" });
	HITLMember = class extends BaseAgent {
		constructor(config, env) {
			super(config);
			this.env = env;
			const cfg = config.config;
			this.hitlConfig = {
				action: cfg?.action || "suspend",
				timeout: cfg?.timeout || 864e5,
				notificationChannel: cfg?.notificationChannel,
				notificationConfig: cfg?.notificationConfig
			};
		}
		async run(context) {
			const action = this.hitlConfig.action;
			switch (action) {
				case "suspend": return await this.suspendForApproval(context);
				case "resume": return await this.resumeExecution(context);
				case "approve": return await this.approveExecution(context);
				case "reject": return await this.rejectExecution(context);
				default: throw new Error(`Unknown HITL action: ${action}`);
			}
		}
		async suspendForApproval(context) {
			const input = context.input;
			if (!input.approvalData) throw new Error("Suspend action requires \"approvalData\" in input");
			const executionId = this.generateExecutionId();
			const expiresAt = Date.now() + this.hitlConfig.timeout;
			context.state, input.approvalData;
			if (this.hitlConfig.notificationChannel) await this.sendNotification(executionId, input.approvalData);
			return {
				status: "suspended",
				executionId,
				approvalUrl: `https://your-app.com/approve/${executionId}`,
				expiresAt
			};
		}
		async resumeExecution(context) {
			const input = context.input;
			if (!input.executionId) throw new Error("Resume action requires \"executionId\" in input");
			const approvalState = {
				executionId: input.executionId,
				state: {},
				suspendedAt: Date.now() - 1e3,
				expiresAt: Date.now() + 864e5,
				approvalData: {},
				status: input.approved ? "approved" : "rejected",
				comments: input.comments
			};
			if (Date.now() > approvalState.expiresAt) return {
				status: "expired",
				executionId: input.executionId,
				comments: "Approval request expired"
			};
			return {
				status: approvalState.status,
				executionId: input.executionId,
				state: approvalState.state,
				comments: input.comments
			};
		}
		async approveExecution(context) {
			const input = context.input;
			return await this.resumeExecution({
				...context,
				input: {
					...input,
					approved: true
				}
			});
		}
		async rejectExecution(context) {
			const input = context.input;
			return await this.resumeExecution({
				...context,
				input: {
					...input,
					approved: false
				}
			});
		}
		async sendNotification(executionId, approvalData) {
			const channel = this.hitlConfig.notificationChannel;
			const config = this.hitlConfig.notificationConfig || {};
			switch (channel) {
				case "slack":
					await this.sendSlackNotification(executionId, approvalData, config);
					break;
				case "email":
					await this.sendEmailNotification(executionId, approvalData, config);
					break;
				case "webhook":
					await this.sendWebhookNotification(executionId, approvalData, config);
					break;
			}
		}
		async sendSlackNotification(executionId, approvalData, config) {
			const webhookUrl = config.webhookUrl;
			if (!webhookUrl || typeof webhookUrl !== "string") throw new Error("Slack notification requires webhookUrl in notificationConfig");
			const message = {
				text: `🔔 Approval Required`,
				blocks: [
					{
						type: "header",
						text: {
							type: "plain_text",
							text: "🔔 Approval Required"
						}
					},
					{
						type: "section",
						text: {
							type: "mrkdwn",
							text: `*Execution ID:* ${executionId}\n*Data:* ${JSON.stringify(approvalData, null, 2)}`
						}
					},
					{
						type: "actions",
						elements: [{
							type: "button",
							text: {
								type: "plain_text",
								text: "Approve"
							},
							style: "primary",
							url: `https://your-app.com/approve/${executionId}?action=approve`
						}, {
							type: "button",
							text: {
								type: "plain_text",
								text: "Reject"
							},
							style: "danger",
							url: `https://your-app.com/approve/${executionId}?action=reject`
						}]
					}
				]
			};
			await fetch(webhookUrl, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(message)
			});
		}
		async sendEmailNotification(executionId, approvalData, config) {
			logger$4.debug("Email notification not yet implemented", { executionId });
		}
		async sendWebhookNotification(executionId, approvalData, config) {
			const webhookUrl = config.webhookUrl;
			if (!webhookUrl || typeof webhookUrl !== "string") throw new Error("Webhook notification requires webhookUrl in notificationConfig");
			await fetch(webhookUrl, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					executionId,
					approvalData,
					approvalUrl: `https://your-app.com/approve/${executionId}`,
					expiresAt: Date.now() + this.hitlConfig.timeout
				})
			});
		}
		generateExecutionId() {
			return `exec_${crypto.randomUUID()}`;
		}
		getApprovalDO(executionId) {
			return null;
		}
	};
}));
var hitl_exports = /* @__PURE__ */ __export({ HITLMember: () => HITLMember });
var init_hitl = __esmMin((() => {
	init_hitl_agent();
}));
var FetchMember;
var init_fetch_agent = __esmMin((() => {
	init_base_agent();
	FetchMember = class extends BaseAgent {
		constructor(config, env) {
			super(config);
			this.env = env;
			const cfg = config.config;
			this.fetchConfig = {
				method: cfg?.method || "GET",
				headers: cfg?.headers || {},
				retry: cfg?.retry !== void 0 ? cfg.retry : 3,
				timeout: cfg?.timeout || 3e4,
				retryDelay: cfg?.retryDelay || 1e3
			};
		}
		async run(context) {
			const input = context.input;
			if (!input.url) throw new Error("Fetch agent requires \"url\" in input");
			const startTime = Date.now();
			const maxRetries = this.fetchConfig.retry || 0;
			for (let attempt = 0; attempt <= maxRetries; attempt++) try {
				return {
					...await this.executeRequest(input, attempt),
					duration: Date.now() - startTime,
					attempt: attempt + 1
				};
			} catch (error) {
				if (attempt === maxRetries) throw new Error(`Fetch failed after ${attempt + 1} attempts: ${error instanceof Error ? error.message : "Unknown error"}`);
				const delay = this.fetchConfig.retryDelay * Math.pow(2, attempt);
				await this.sleep(delay);
			}
			throw new Error("Fetch failed: Maximum retries exceeded");
		}
		async executeRequest(input, attempt) {
			const url = input.url;
			const method = this.fetchConfig.method || "GET";
			const headers = {
				...this.fetchConfig.headers,
				...input.headers
			};
			const options = {
				method,
				headers,
				signal: AbortSignal.timeout(this.fetchConfig.timeout)
			};
			if (input.body && [
				"POST",
				"PUT",
				"PATCH"
			].includes(method)) if (typeof input.body === "object") {
				options.body = JSON.stringify(input.body);
				if (!headers["Content-Type"]) headers["Content-Type"] = "application/json";
			} else options.body = input.body;
			const response = await fetch(url, options);
			const contentType = response.headers.get("content-type") || "";
			let body;
			if (contentType.includes("application/json")) body = await response.json();
			else if (contentType.includes("text/")) body = await response.text();
			else body = await response.text();
			if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			return {
				status: response.status,
				statusText: response.statusText,
				headers: Object.fromEntries(response.headers.entries()),
				body
			};
		}
		sleep(ms) {
			return new Promise((resolve$2) => setTimeout(resolve$2, ms));
		}
	};
}));
var fetch_exports = /* @__PURE__ */ __export({ FetchMember: () => FetchMember });
var init_fetch = __esmMin((() => {
	init_fetch_agent();
}));
var MCPClient;
var init_mcp_client = __esmMin((() => {
	MCPClient = class {
		constructor(config) {
			this.config = config;
		}
		async listTools() {
			const url = `${this.config.url}/tools`;
			return await this.request(url, { method: "GET" });
		}
		async invokeTool(toolName, args) {
			const url = `${this.config.url}/tools/${encodeURIComponent(toolName)}`;
			const body = {
				name: toolName,
				arguments: args
			};
			return await this.request(url, {
				method: "POST",
				body: JSON.stringify(body),
				headers: { "Content-Type": "application/json" }
			});
		}
		async request(url, options) {
			const headers = { ...options.headers };
			if (this.config.auth) {
				if (this.config.auth.type === "bearer" && this.config.auth.token) headers["Authorization"] = `Bearer ${this.config.auth.token}`;
				else if (this.config.auth.type === "oauth" && this.config.auth.accessToken) headers["Authorization"] = `Bearer ${this.config.auth.accessToken}`;
			}
			const timeout = this.config.timeout || 3e4;
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), timeout);
			try {
				const response = await fetch(url, {
					...options,
					headers,
					signal: controller.signal
				});
				if (!response.ok) {
					const errorText = await response.text().catch(() => "Unknown error");
					throw new Error(`MCP server error: ${response.status} ${response.statusText} - ${errorText}`);
				}
				return await response.json();
			} catch (error) {
				if (error instanceof Error) {
					if (error.name === "AbortError") throw new Error(`MCP request timeout after ${timeout}ms`);
					throw error;
				}
				throw new Error("Unknown MCP client error");
			} finally {
				clearTimeout(timeoutId);
			}
		}
	};
}));
var ToolsMember;
var init_tools_agent = __esmMin((() => {
	init_base_agent();
	init_mcp_client();
	ToolsMember = class extends BaseAgent {
		constructor(config, env) {
			super(config);
			this.env = env;
			this.mcpServerConfig = null;
			const cfg = config.config;
			if (!cfg || !cfg.mcp || !cfg.tool) throw new Error("Tools agent requires \"mcp\" (server name) and \"tool\" (tool name) in config");
			this.toolsConfig = {
				mcp: cfg.mcp,
				tool: cfg.tool,
				timeout: cfg.timeout,
				cacheDiscovery: cfg.cacheDiscovery ?? true,
				cacheTTL: cfg.cacheTTL || 3600
			};
		}
		async run(context) {
			const input = context.input;
			const startTime = Date.now();
			try {
				const response = await new MCPClient(await this.loadMCPServerConfig()).invokeTool(this.toolsConfig.tool, input);
				return {
					tool: this.toolsConfig.tool,
					server: this.toolsConfig.mcp,
					content: response.content,
					duration: Date.now() - startTime,
					isError: response.isError
				};
			} catch (error) {
				throw new Error(`Failed to invoke tool "${this.toolsConfig.tool}" on MCP server "${this.toolsConfig.mcp}": ${error instanceof Error ? error.message : "Unknown error"}`);
			}
		}
		async loadMCPServerConfig() {
			const mcpServers = this.env.MCP_SERVERS;
			if (!mcpServers) throw new Error("MCP servers not configured. Add MCP_SERVERS binding or configure in conductor.config.ts");
			const serverConfig = mcpServers[this.toolsConfig.mcp];
			if (!serverConfig) throw new Error(`MCP server "${this.toolsConfig.mcp}" not found in configuration. Available servers: ${Object.keys(mcpServers).join(", ")}`);
			if (this.toolsConfig.timeout) serverConfig.timeout = this.toolsConfig.timeout;
			return serverConfig;
		}
		async discoverTools() {
			const client = new MCPClient(await this.loadMCPServerConfig());
			if (this.toolsConfig.cacheDiscovery) {
				const cached = await this.getCachedTools(this.toolsConfig.mcp);
				if (cached) return cached;
			}
			const response = await client.listTools();
			if (this.toolsConfig.cacheDiscovery) await this.cacheTools(this.toolsConfig.mcp, response.tools);
			return response.tools;
		}
		async getCachedTools(serverName) {
			try {
				const kv = this.env.MCP_CACHE;
				if (!kv) return null;
				const cacheKey = `mcp:tools:${serverName}`;
				return await kv.get(cacheKey, "json");
			} catch (error) {
				return null;
			}
		}
		async cacheTools(serverName, tools) {
			try {
				const kv = this.env.MCP_CACHE;
				if (!kv) return;
				const cacheKey = `mcp:tools:${serverName}`;
				await kv.put(cacheKey, JSON.stringify(tools), { expirationTtl: this.toolsConfig.cacheTTL });
			} catch (error) {}
		}
	};
}));
var tools_exports = /* @__PURE__ */ __export({
	MCPClient: () => MCPClient,
	ToolsMember: () => ToolsMember
});
var init_tools = __esmMin((() => {
	init_tools_agent();
	init_mcp_client();
}));
var QueriesMember;
var init_queries_agent = __esmMin((() => {
	init_base_agent();
	QueriesMember = class extends BaseAgent {
		constructor(config, env) {
			super(config);
			this.env = env;
			const cfg = config.config;
			this.queriesConfig = {
				defaultDatabase: cfg?.defaultDatabase,
				cacheTTL: cfg?.cacheTTL,
				maxRows: cfg?.maxRows,
				timeout: cfg?.timeout,
				readOnly: cfg?.readOnly !== void 0 ? cfg.readOnly : false,
				transform: cfg?.transform || "none",
				includeMetadata: cfg?.includeMetadata !== void 0 ? cfg.includeMetadata : true
			};
		}
		async run(context) {
			const input = context.input;
			if (!input.queryName && !input.sql) throw new Error("Either queryName or sql must be provided");
			if (input.queryName && input.sql) throw new Error("Cannot specify both queryName and sql");
			const query = input.queryName ? await this.loadQueryFromCatalog(input.queryName) : {
				sql: input.sql,
				params: {},
				database: input.database
			};
			const database = input.database || query.database || this.queriesConfig.defaultDatabase;
			if (!database) throw new Error("No database specified and no default database configured");
			const hyperdrive = this.env[database];
			if (!hyperdrive) throw new Error(`Hyperdrive binding not found: ${database}`);
			if (this.queriesConfig.readOnly && this.isWriteQuery(query.sql)) throw new Error("Write operations not allowed in read-only mode");
			const { sql, params } = this.prepareQuery(query.sql, input.input || query.params || {});
			const startTime = Date.now();
			const result = await this.executeQuery(hyperdrive, sql, params);
			const executionTime = Date.now() - startTime;
			let rows = result.rows;
			if (this.queriesConfig.transform === "camelCase") rows = this.toCamelCase(rows);
			else if (this.queriesConfig.transform === "snakeCase") rows = this.toSnakeCase(rows);
			if (this.queriesConfig.maxRows && rows.length > this.queriesConfig.maxRows) rows = rows.slice(0, this.queriesConfig.maxRows);
			return {
				rows,
				count: rows.length,
				metadata: {
					columns: result.columns || [],
					executionTime,
					cached: false,
					database,
					...this.queriesConfig.includeMetadata && { query: sql }
				}
			};
		}
		async loadQueryFromCatalog(queryName) {
			throw new Error(`Query catalog not yet implemented. Use inline SQL with 'sql' parameter instead of 'queryName'.`);
		}
		prepareQuery(sql, input) {
			if (Array.isArray(input)) return {
				sql,
				params: input
			};
			const params = [];
			let paramIndex = 1;
			return {
				sql: sql.replace(/:(\w+)/g, (match, paramName) => {
					if (!(paramName in input)) throw new Error(`Missing parameter: ${paramName}`);
					params.push(input[paramName]);
					return `$${paramIndex++}`;
				}),
				params
			};
		}
		async executeQuery(hyperdrive, sql, params) {
			let stmt = hyperdrive.prepare(sql);
			if (params.length > 0) stmt = stmt.bind(...params);
			const executePromise = stmt.all();
			const result = this.queriesConfig.timeout ? await Promise.race([executePromise, new Promise((_, reject$1) => setTimeout(() => reject$1(/* @__PURE__ */ new Error("Query timeout")), this.queriesConfig.timeout))]) : await executePromise;
			const columns = result.results.length > 0 ? Object.keys(result.results[0]) : result.meta?.columns ? result.meta.columns.map((c) => c.name) : [];
			return {
				rows: result.results,
				columns
			};
		}
		isWriteQuery(sql) {
			const upperSQL = sql.trim().toUpperCase();
			return /^(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|REPLACE)/i.test(upperSQL);
		}
		toCamelCase(rows) {
			return rows.map((row) => {
				const transformed = {};
				for (const [key, value] of Object.entries(row)) {
					const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
					transformed[camelKey] = value;
				}
				return transformed;
			});
		}
		toSnakeCase(rows) {
			return rows.map((row) => {
				const transformed = {};
				for (const [key, value] of Object.entries(row)) {
					const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
					transformed[snakeKey] = value;
				}
				return transformed;
			});
		}
	};
}));
var queries_exports = /* @__PURE__ */ __export({ QueriesMember: () => QueriesMember });
var init_queries = __esmMin((() => {
	init_queries_agent();
}));
var BuiltInMemberRegistry = class {
	constructor() {
		this.agents = /* @__PURE__ */ new Map();
	}
	register(metadata, factory) {
		this.agents.set(metadata.name, {
			metadata,
			factory,
			loaded: false
		});
	}
	isBuiltIn(name) {
		return this.agents.has(name);
	}
	create(name, config, env) {
		const entry = this.agents.get(name);
		if (!entry) throw new Error(`Built-in agent "${name}" not found. Available: ${this.getAvailableNames().join(", ")}`);
		entry.loaded = true;
		return entry.factory(config, env);
	}
	getMetadata(name) {
		return this.agents.get(name)?.metadata;
	}
	list() {
		return Array.from(this.agents.values()).map((entry) => entry.metadata);
	}
	getAvailableNames() {
		return Array.from(this.agents.keys());
	}
	listByType(type) {
		return this.list().filter((m) => m.operation === type);
	}
	listByTag(tag) {
		return this.list().filter((m) => m.tags?.includes(tag));
	}
};
var registry = null;
function getBuiltInRegistry() {
	if (!registry) {
		registry = new BuiltInMemberRegistry();
		registerAllBuiltInMembers(registry);
	}
	return registry;
}
function registerAllBuiltInMembers(registry$1) {
	registry$1.register({
		name: "scrape",
		version: "1.0.0",
		description: "3-tier web scraping with bot protection and fallback strategies",
		operation: Operation.code,
		tags: [
			"web",
			"scraping",
			"cloudflare",
			"browser-rendering"
		],
		examples: [{
			name: "basic-scrape",
			description: "Simple web scraping with balanced strategy",
			input: { url: "https://example.com" },
			config: {
				strategy: "balanced",
				returnFormat: "markdown"
			},
			output: {
				markdown: "...",
				tier: 1,
				duration: 350
			}
		}, {
			name: "aggressive-scrape",
			description: "Aggressive scraping with all fallback tiers",
			input: { url: "https://example.com" },
			config: {
				strategy: "aggressive",
				returnFormat: "markdown"
			},
			output: {
				markdown: "...",
				tier: 3,
				duration: 4500
			}
		}],
		documentation: "https://docs.conductor.dev/built-in-agents/scrape"
	}, (config, env) => {
		const { ScrapeMember: ScrapeMember$1 } = (init_scrape(), __toCommonJS(scrape_exports));
		return new ScrapeMember$1(config, env);
	});
	registry$1.register({
		name: "validate",
		version: "1.0.0",
		description: "Validation and evaluation with pluggable evaluators (judge, NLP, embedding, rule)",
		operation: Operation.scoring,
		tags: [
			"validation",
			"evaluation",
			"scoring",
			"quality"
		],
		examples: [{
			name: "rule-validation",
			description: "Validate content using custom rules",
			input: { content: "Sample content..." },
			config: {
				evalType: "rule",
				rules: [{
					name: "minLength",
					check: "content.length >= 800",
					weight: .5
				}],
				threshold: .7
			},
			output: {
				passed: true,
				score: .85,
				details: {}
			}
		}, {
			name: "llm-judge",
			description: "Evaluate quality using LLM judge",
			input: {
				content: "Sample content...",
				reference: "Expected output..."
			},
			config: {
				evalType: "judge",
				criteria: [{
					name: "accuracy",
					weight: .4
				}, {
					name: "relevance",
					weight: .3
				}],
				threshold: .8
			}
		}],
		documentation: "https://docs.conductor.dev/built-in-agents/validate"
	}, (config, env) => {
		const { ValidateMember: ValidateMember$1 } = (init_validate(), __toCommonJS(validate_exports));
		return new ValidateMember$1(config, env);
	});
	registry$1.register({
		name: "rag",
		version: "1.0.0",
		description: "RAG system using Cloudflare Vectorize and AI embeddings",
		operation: Operation.storage,
		tags: [
			"rag",
			"vectorize",
			"embeddings",
			"search",
			"ai"
		],
		examples: [{
			name: "index-content",
			description: "Index content into vector database",
			input: {
				content: "Document content...",
				id: "doc-123",
				source: "https://example.com"
			},
			config: {
				operation: "index",
				chunkStrategy: "semantic",
				chunkSize: 512
			},
			output: {
				indexed: 10,
				chunks: 10
			}
		}, {
			name: "search-content",
			description: "Search for relevant content",
			input: { query: "What is the company mission?" },
			config: {
				operation: "search",
				topK: 5,
				rerank: true
			},
			output: {
				results: [],
				count: 5
			}
		}],
		documentation: "https://docs.conductor.dev/built-in-agents/rag"
	}, (config, env) => {
		const { RAGMember: RAGMember$1 } = (init_rag(), __toCommonJS(rag_exports));
		return new RAGMember$1(config, env);
	});
	registry$1.register({
		name: "hitl",
		version: "1.0.0",
		description: "Human-in-the-loop workflows with approval gates and notifications",
		operation: Operation.code,
		tags: [
			"workflow",
			"approval",
			"human-in-loop",
			"durable-objects"
		],
		examples: [{
			name: "approval-gate",
			description: "Suspend workflow for manual approval",
			input: { approvalData: {
				transaction: {
					amount: 1e4,
					to: "account-123"
				},
				risk_score: .85
			} },
			config: {
				action: "suspend",
				timeout: 864e5,
				notificationChannel: "slack"
			},
			output: {
				status: "suspended",
				executionId: "exec-123",
				approvalUrl: "https://app.com/approve/exec-123"
			}
		}],
		documentation: "https://docs.conductor.dev/built-in-agents/hitl"
	}, (config, env) => {
		const { HITLMember: HITLMember$1 } = (init_hitl(), __toCommonJS(hitl_exports));
		return new HITLMember$1(config, env);
	});
	registry$1.register({
		name: "fetch",
		version: "1.0.0",
		description: "HTTP client with retry logic and exponential backoff",
		operation: Operation.code,
		tags: [
			"http",
			"api",
			"fetch",
			"retry"
		],
		examples: [{
			name: "basic-fetch",
			description: "Simple HTTP GET request",
			input: { url: "https://api.example.com/data" },
			config: {
				method: "GET",
				retry: 3,
				timeout: 5e3
			},
			output: {
				status: 200,
				body: {},
				headers: {}
			}
		}, {
			name: "post-with-retry",
			description: "POST request with retry logic",
			input: {
				url: "https://api.example.com/submit",
				body: { data: "value" }
			},
			config: {
				method: "POST",
				retry: 5,
				timeout: 1e4,
				headers: { "Content-Type": "application/json" }
			}
		}],
		documentation: "https://docs.conductor.dev/built-in-agents/fetch"
	}, (config, env) => {
		const { FetchMember: FetchMember$1 } = (init_fetch(), __toCommonJS(fetch_exports));
		return new FetchMember$1(config, env);
	});
	registry$1.register({
		name: "tools",
		version: "1.0.0",
		description: "Invoke external MCP (Model Context Protocol) tools over HTTP",
		operation: Operation.tools,
		tags: [
			"mcp",
			"tools",
			"integration",
			"http"
		],
		examples: [{
			name: "github-tool",
			description: "Get GitHub pull request data",
			input: {
				owner: "anthropics",
				repo: "anthropic-sdk-typescript",
				pull_number: 123
			},
			config: {
				mcp: "github",
				tool: "get_pull_request"
			},
			output: {
				tool: "get_pull_request",
				server: "github",
				content: [{
					type: "text",
					text: "PR data..."
				}],
				duration: 450
			}
		}, {
			name: "search-tool",
			description: "Search the web",
			input: {
				query: "latest AI developments",
				limit: 10
			},
			config: {
				mcp: "search-engine",
				tool: "search",
				timeout: 5e3
			}
		}],
		documentation: "https://docs.conductor.dev/built-in-agents/tools"
	}, (config, env) => {
		const { ToolsMember: ToolsMember$1 } = (init_tools(), __toCommonJS(tools_exports));
		return new ToolsMember$1(config, env);
	});
	registry$1.register({
		name: "queries",
		version: "1.0.0",
		description: "Execute SQL queries across Hyperdrive-connected databases with query catalog support",
		operation: Operation.storage,
		tags: [
			"sql",
			"database",
			"queries",
			"hyperdrive",
			"analytics"
		],
		examples: [{
			name: "catalog-query",
			description: "Execute query from catalog",
			input: {
				queryName: "user-analytics",
				input: {
					startDate: "2024-01-01",
					endDate: "2024-01-31"
				}
			},
			config: {
				defaultDatabase: "analytics",
				readOnly: true,
				transform: "camelCase"
			},
			output: {
				rows: [],
				count: 25,
				metadata: {
					columns: [
						"date",
						"user_count",
						"active_users"
					],
					executionTime: 150,
					cached: false,
					database: "analytics"
				}
			}
		}, {
			name: "inline-query",
			description: "Execute inline SQL query",
			input: {
				sql: "SELECT * FROM users WHERE created_at > $1 LIMIT 100",
				input: ["2024-01-01"]
			},
			config: {
				defaultDatabase: "production",
				readOnly: true,
				maxRows: 100
			}
		}],
		inputSchema: {
			type: "object",
			properties: {
				queryName: {
					type: "string",
					description: "Query name from catalog"
				},
				sql: {
					type: "string",
					description: "Inline SQL query"
				},
				input: {
					oneOf: [{ type: "object" }, { type: "array" }],
					description: "Query parameters"
				},
				database: {
					type: "string",
					description: "Database alias"
				}
			}
		},
		outputSchema: {
			type: "object",
			properties: {
				rows: { type: "array" },
				count: { type: "number" },
				metadata: { type: "object" }
			}
		},
		configSchema: {
			type: "object",
			properties: {
				defaultDatabase: { type: "string" },
				cacheTTL: { type: "number" },
				maxRows: { type: "number" },
				timeout: { type: "number" },
				readOnly: { type: "boolean" },
				transform: {
					type: "string",
					enum: [
						"none",
						"camelCase",
						"snakeCase"
					]
				},
				includeMetadata: { type: "boolean" }
			}
		},
		documentation: "https://docs.conductor.dev/built-in-agents/queries"
	}, (config, env) => {
		const { QueriesMember: QueriesMember$1 } = (init_queries(), __toCommonJS(queries_exports));
		return new QueriesMember$1(config, env);
	});
}
init_observability();
var logger$3 = createLogger({ serviceName: "scoring-executor" });
var ScoringExecutor = class {
	async executeWithScoring(executeAgent, evaluateOutput, config) {
		const startTime = Date.now();
		let attempts = 0;
		let lastScore;
		let lastOutput;
		let backoffMs = 1e3;
		const maxAttempts = config.retryLimit || 3;
		while (attempts < maxAttempts) {
			attempts++;
			try {
				const output = await executeAgent();
				lastOutput = output;
				const score = await evaluateOutput(output, attempts, lastScore);
				lastScore = score;
				if (score.passed) return {
					output,
					score,
					attempts,
					status: "passed",
					executionTime: Date.now() - startTime
				};
				if (config.requireImprovement && lastScore && attempts > 1) {
					if (score.score - lastScore.score < (config.minImprovement || .05)) return {
						output,
						score,
						attempts,
						status: "max_retries_exceeded",
						executionTime: Date.now() - startTime
					};
				}
				switch (config.onFailure || "retry") {
					case "retry":
						if (attempts < maxAttempts) {
							await this.applyBackoff(backoffMs);
							backoffMs = this.calculateNextBackoff(backoffMs, "exponential");
						}
						break;
					case "continue":
						logger$3.warn("Score below threshold, continuing anyway", {
							score: score.score,
							threshold: config.thresholds?.minimum,
							attempts
						});
						return {
							output,
							score,
							attempts,
							status: "below_threshold",
							executionTime: Date.now() - startTime
						};
					case "abort": throw Errors.internal(`Score ${score.score} below minimum threshold ${config.thresholds?.minimum}`);
				}
			} catch (error) {
				if (attempts >= maxAttempts) throw error;
				await this.applyBackoff(backoffMs);
				backoffMs = this.calculateNextBackoff(backoffMs, "exponential");
			}
		}
		return {
			output: lastOutput,
			score: lastScore,
			attempts,
			status: "max_retries_exceeded",
			executionTime: Date.now() - startTime
		};
	}
	async applyBackoff(ms) {
		return new Promise((resolve$2) => setTimeout(resolve$2, ms));
	}
	calculateNextBackoff(current, strategy) {
		switch (strategy) {
			case "exponential": return Math.min(current * 2, 6e4);
			case "linear": return Math.min(current + 1e3, 3e4);
			case "fixed":
			default: return current;
		}
	}
	calculateCompositeScore(breakdown, weights) {
		const criteria = Object.keys(breakdown);
		if (!criteria.length) return 0;
		if (!weights) return criteria.reduce((acc, key) => acc + breakdown[key], 0) / criteria.length;
		let weightedSum = 0;
		let totalWeight = 0;
		for (const criterion of criteria) {
			const weight = weights[criterion] || 1;
			weightedSum += breakdown[criterion] * weight;
			totalWeight += weight;
		}
		return totalWeight > 0 ? weightedSum / totalWeight : 0;
	}
	checkThreshold(score, threshold) {
		return score >= threshold;
	}
	getScoreRange(score) {
		if (score >= .95) return "excellent";
		if (score >= .8) return "good";
		if (score >= .6) return "acceptable";
		return "poor";
	}
	getFailedCriteria(breakdown, threshold) {
		return Object.entries(breakdown).filter(([_, score]) => score < threshold).map(([criterion]) => criterion);
	}
};
var EnsembleScorer = class {
	constructor(config) {
		this.config = config;
	}
	calculateEnsembleScore(history, weights) {
		if (!history.length) return 0;
		if (!weights) {
			const latestScores$1 = this.getLatestScoresPerMember(history);
			return Array.from(latestScores$1.values()).reduce((acc, score) => acc + score, 0) / latestScores$1.size;
		}
		const latestScores = this.getLatestScoresPerMember(history);
		let weightedSum = 0;
		let totalWeight = 0;
		for (const [agent, score] of latestScores.entries()) {
			const weight = weights[agent] || 1;
			weightedSum += score * weight;
			totalWeight += weight;
		}
		return totalWeight > 0 ? weightedSum / totalWeight : 0;
	}
	getLatestScoresPerMember(history) {
		const scores = /* @__PURE__ */ new Map();
		for (const entry of history) if (entry.passed) scores.set(entry.agent, entry.score);
		return scores;
	}
	calculateQualityMetrics(history) {
		if (!history.length) return {
			ensembleScore: 0,
			averageScore: 0,
			minScore: 0,
			maxScore: 0,
			totalEvaluations: 0,
			passRate: 0,
			totalRetries: 0,
			averageAttempts: 0
		};
		const scores = history.map((e) => e.score);
		const attempts = history.map((e) => e.attempt);
		const ensembleScore = this.calculateEnsembleScore(history);
		const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
		const minScore = Math.min(...scores);
		const maxScore = Math.max(...scores);
		const passRate = history.filter((e) => e.passed).length / history.length;
		const totalRetries = attempts.filter((a) => a > 1).length;
		const averageAttempts = attempts.reduce((a, b) => a + b, 0) / attempts.length;
		const criteriaBreakdown = this.aggregateCriteria(history);
		return {
			ensembleScore,
			averageScore,
			minScore,
			maxScore,
			totalEvaluations: history.length,
			passRate,
			criteriaBreakdown,
			totalRetries,
			averageAttempts
		};
	}
	aggregateCriteria(history) {
		const criteria = {};
		for (const entry of history) if (entry.breakdown) for (const [criterion, score] of Object.entries(entry.breakdown)) {
			if (!criteria[criterion]) criteria[criterion] = {
				scores: [],
				average: 0,
				passRate: 0
			};
			criteria[criterion].scores.push(score);
		}
		const threshold = this.config.defaultThresholds.minimum;
		for (const criterion of Object.keys(criteria)) {
			const scores = criteria[criterion].scores;
			criteria[criterion].average = scores.reduce((a, b) => a + b, 0) / scores.length;
			criteria[criterion].passRate = scores.filter((s) => s >= threshold).length / scores.length;
		}
		return criteria;
	}
	updateScoringState(state, entry) {
		const newHistory = [...state.scoreHistory, entry];
		const retryCount = { ...state.retryCount };
		if (entry.attempt > 1) retryCount[entry.agent] = (retryCount[entry.agent] || 0) + 1;
		const qualityMetrics = this.calculateQualityMetrics(newHistory);
		return {
			scoreHistory: newHistory,
			finalScore: qualityMetrics.ensembleScore,
			retryCount,
			qualityMetrics
		};
	}
	initializeScoringState() {
		return {
			scoreHistory: [],
			finalScore: void 0,
			retryCount: {},
			qualityMetrics: void 0
		};
	}
	isQualityDegrading(history, windowSize = 5) {
		if (history.length < windowSize * 2) return false;
		const recentScores = history.slice(-windowSize).map((e) => e.score);
		const olderScores = history.slice(-windowSize * 2, -windowSize).map((e) => e.score);
		return recentScores.reduce((a, b) => a + b, 0) / recentScores.length < olderScores.reduce((a, b) => a + b, 0) / olderScores.length - .1;
	}
	getRecommendations(metrics) {
		const recommendations = [];
		if (metrics.ensembleScore < .7) recommendations.push("Overall ensemble score is low. Review agent configurations and criteria.");
		if (metrics.totalRetries > metrics.totalEvaluations * .5) recommendations.push("High retry rate detected. Consider adjusting thresholds or improving agent quality.");
		if (metrics.passRate < .8) recommendations.push(`Pass rate is ${(metrics.passRate * 100).toFixed(0)}%. Review failing criteria.`);
		if (metrics.criteriaBreakdown) {
			for (const [criterion, data] of Object.entries(metrics.criteriaBreakdown)) if (data.passRate < .7) recommendations.push(`Criterion '${criterion}' has low pass rate (${(data.passRate * 100).toFixed(0)}%). Focus improvement efforts here.`);
		}
		return recommendations;
	}
	getScoreTrend(history, windowSize = 5) {
		if (history.length < windowSize * 2) return "stable";
		const recentScores = history.slice(-windowSize).map((e) => e.score);
		const olderScores = history.slice(-windowSize * 2, -windowSize).map((e) => e.score);
		const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
		const olderAvg = olderScores.reduce((a, b) => a + b, 0) / olderScores.length;
		const changeThreshold = .05;
		if (recentAvg > olderAvg + changeThreshold) return "improving";
		else if (recentAvg < olderAvg - changeThreshold) return "declining";
		return "stable";
	}
};
init_observability();
var logger$2 = createLogger({ serviceName: "webhook-notifier" });
var WebhookNotifier = class {
	constructor(config) {
		this.config = {
			retries: config.retries || 3,
			timeout: config.timeout || 5e3,
			...config
		};
	}
	async send(eventData) {
		const startTime = Date.now();
		const maxRetries = this.config.retries || 0;
		for (let attempt = 0; attempt <= maxRetries; attempt++) try {
			const result = await this.sendRequest(eventData, attempt);
			return {
				success: true,
				type: "webhook",
				target: this.config.url,
				event: eventData.event,
				duration: Date.now() - startTime,
				statusCode: result.status,
				attempts: attempt + 1
			};
		} catch (error) {
			logger$2.error("Webhook notification failed", error instanceof Error ? error : void 0, {
				url: this.config.url,
				attempt: attempt + 1,
				maxRetries: maxRetries + 1
			});
			if (attempt === maxRetries) return {
				success: false,
				type: "webhook",
				target: this.config.url,
				event: eventData.event,
				duration: Date.now() - startTime,
				error: error instanceof Error ? error.message : "Unknown error",
				attempts: attempt + 1
			};
			const delay = this.calculateBackoff(attempt);
			await this.sleep(delay);
		}
		return {
			success: false,
			type: "webhook",
			target: this.config.url,
			event: eventData.event,
			duration: Date.now() - startTime,
			error: "Maximum retries exceeded",
			attempts: maxRetries + 1
		};
	}
	async sendRequest(eventData, attempt) {
		const timestamp$1 = Math.floor(Date.now() / 1e3);
		const payload = {
			event: eventData.event,
			timestamp: eventData.timestamp,
			data: eventData.data
		};
		const body = JSON.stringify(payload);
		const headers = {
			"Content-Type": "application/json",
			"User-Agent": "Conductor-Webhook/1.0",
			"X-Conductor-Event": eventData.event,
			"X-Conductor-Timestamp": timestamp$1.toString(),
			"X-Conductor-Delivery-Attempt": (attempt + 1).toString()
		};
		if (this.config.secret) headers["X-Conductor-Signature"] = await this.generateSignature(body, timestamp$1, this.config.secret);
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
		try {
			const response = await fetch(this.config.url, {
				method: "POST",
				headers,
				body,
				signal: controller.signal
			});
			if (!response.ok && response.status >= 400) throw new Error(`Webhook returned ${response.status}: ${response.statusText}`);
			return { status: response.status };
		} finally {
			clearTimeout(timeoutId);
		}
	}
	async generateSignature(body, timestamp$1, secret) {
		const payload = `${timestamp$1}.${body}`;
		const encoder = new TextEncoder();
		const key = await crypto.subtle.importKey("raw", encoder.encode(secret), {
			name: "HMAC",
			hash: "SHA-256"
		}, false, ["sign"]);
		const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
		return `sha256=${Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("")}`;
	}
	calculateBackoff(attempt) {
		const delays = [
			1e3,
			5e3,
			3e4,
			12e4,
			3e5
		];
		return delays[Math.min(attempt, delays.length - 1)];
	}
	sleep(ms) {
		return new Promise((resolve$2) => setTimeout(resolve$2, ms));
	}
};
init_observability();
var logger$1 = createLogger({ serviceName: "email-notifier" });
var EmailNotifier = class {
	constructor(config) {
		this.config = config;
	}
	async send(eventData, env) {
		const startTime = Date.now();
		try {
			const emailData = this.buildEmailData(eventData);
			await this.sendEmail(emailData, env);
			logger$1.info("Email notification sent", {
				to: emailData.to,
				event: eventData.event
			});
			return {
				success: true,
				type: "email",
				target: emailData.to.join(", "),
				event: eventData.event,
				duration: Date.now() - startTime
			};
		} catch (error) {
			logger$1.error("Email notification failed", error instanceof Error ? error : void 0, {
				to: this.config.to,
				event: eventData.event
			});
			return {
				success: false,
				type: "email",
				target: this.config.to.join(", "),
				event: eventData.event,
				duration: Date.now() - startTime,
				error: error instanceof Error ? error.message : "Unknown error"
			};
		}
	}
	buildEmailData(eventData) {
		const subject = this.interpolateSubject(eventData);
		const text = this.buildTextBody(eventData);
		const html = this.buildHtmlBody(eventData);
		return {
			to: this.config.to,
			from: this.config.from || "notifications@conductor.dev",
			subject,
			text,
			html,
			event: eventData.event,
			eventData: eventData.data
		};
	}
	interpolateSubject(eventData) {
		if (!this.config.subject) return `Conductor: ${eventData.event}`;
		let subject = this.config.subject;
		subject = subject.replace(/\${event}/g, eventData.event);
		subject = subject.replace(/\${ensemble\.name}/g, eventData.data.ensemble || "Unknown");
		subject = subject.replace(/\${timestamp}/g, eventData.timestamp);
		return subject;
	}
	buildTextBody(eventData) {
		return [
			`Event: ${eventData.event}`,
			`Timestamp: ${eventData.timestamp}`,
			"",
			"Details:",
			JSON.stringify(eventData.data, null, 2),
			"",
			"---",
			"This is an automated notification from Conductor."
		].join("\n");
	}
	buildHtmlBody(eventData) {
		eventData.event.split(".")[0];
		const eventAction = eventData.event.split(".")[1] || "";
		let color = "#2563eb";
		if (eventAction === "failed" || eventAction === "timeout") color = "#dc2626";
		else if (eventAction === "completed") color = "#16a34a";
		return `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<style>
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
			line-height: 1.6;
			color: #333;
			max-width: 600px;
			margin: 0 auto;
			padding: 20px;
		}
		.header {
			background-color: ${color};
			color: white;
			padding: 20px;
			border-radius: 8px 8px 0 0;
		}
		.header h1 {
			margin: 0;
			font-size: 24px;
		}
		.content {
			background-color: #f9fafb;
			padding: 20px;
			border: 1px solid #e5e7eb;
			border-top: none;
			border-radius: 0 0 8px 8px;
		}
		.detail {
			margin: 10px 0;
		}
		.label {
			font-weight: 600;
			color: #6b7280;
		}
		.value {
			color: #111827;
		}
		.data {
			background-color: white;
			border: 1px solid #e5e7eb;
			border-radius: 4px;
			padding: 15px;
			margin-top: 15px;
			overflow-x: auto;
		}
		pre {
			margin: 0;
			font-size: 12px;
		}
		.footer {
			margin-top: 20px;
			padding-top: 20px;
			border-top: 1px solid #e5e7eb;
			text-align: center;
			color: #6b7280;
			font-size: 14px;
		}
	</style>
</head>
<body>
	<div class="header">
		<h1>${eventData.event}</h1>
	</div>
	<div class="content">
		<div class="detail">
			<span class="label">Timestamp:</span>
			<span class="value">${eventData.timestamp}</span>
		</div>
		<div class="data">
			<pre>${JSON.stringify(eventData.data, null, 2)}</pre>
		</div>
	</div>
	<div class="footer">
		This is an automated notification from Conductor.
	</div>
</body>
</html>
		`.trim();
	}
	async sendEmail(emailData, env) {
		const response = await fetch("https://api.mailchannels.net/tx/v1/send", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				personalizations: [{ to: emailData.to.map((email) => ({ email })) }],
				from: {
					email: emailData.from,
					name: "Conductor Notifications"
				},
				subject: emailData.subject,
				content: [{
					type: "text/plain",
					value: emailData.text
				}, {
					type: "text/html",
					value: emailData.html || emailData.text
				}]
			})
		});
		if (!response.ok) {
			const errorText = await response.text().catch(() => "Unknown error");
			throw new Error(`MailChannels API error: ${response.status} - ${errorText}`);
		}
	}
};
init_observability();
var logger = createLogger({ serviceName: "notification-manager" });
var NotificationManager = class {
	static async notify(ensemble, event, eventData, env) {
		if (!ensemble.notifications || ensemble.notifications.length === 0) return [];
		const notificationEvent = {
			event,
			timestamp: (/* @__PURE__ */ new Date()).toISOString(),
			data: {
				ensemble: ensemble.name,
				...eventData
			}
		};
		const relevantNotifications = ensemble.notifications.filter((notification) => notification.events.includes(event));
		if (relevantNotifications.length === 0) return [];
		logger.info("Sending notifications", {
			ensemble: ensemble.name,
			event,
			count: relevantNotifications.length
		});
		const results = await Promise.all(relevantNotifications.map((notification) => this.sendNotification(notification, notificationEvent, env)));
		const successful = results.filter((r) => r.success).length;
		const failed = results.filter((r) => !r.success).length;
		logger.info("Notifications sent", {
			ensemble: ensemble.name,
			event,
			total: results.length,
			successful,
			failed
		});
		return results;
	}
	static async sendNotification(config, eventData, env) {
		try {
			if (config.type === "webhook") return await new WebhookNotifier({
				url: config.url,
				secret: config.secret,
				retries: config.retries,
				timeout: config.timeout
			}).send(eventData);
			else if (config.type === "email") return await new EmailNotifier({
				to: config.to,
				from: config.from,
				subject: config.subject,
				events: config.events
			}).send(eventData, env);
			const unknownType$1 = config.type || "unknown";
			return {
				success: false,
				type: unknownType$1,
				target: "unknown",
				event: eventData.event,
				duration: 0,
				error: `Unknown notification type: ${unknownType$1}`
			};
		} catch (error) {
			logger.error("Notification failed", error instanceof Error ? error : void 0, {
				type: config.type,
				event: eventData.event
			});
			let target = "unknown";
			if (config.type === "webhook") target = config.url;
			else if (config.type === "email") target = config.to.join(", ");
			return {
				success: false,
				type: config.type,
				target,
				event: eventData.event,
				duration: 0,
				error: error instanceof Error ? error.message : "Unknown error"
			};
		}
	}
	static async emitExecutionStarted(ensemble, executionId, input, env) {
		return this.notify(ensemble, "execution.started", {
			id: executionId,
			input
		}, env);
	}
	static async emitExecutionCompleted(ensemble, executionId, output, duration, env) {
		return this.notify(ensemble, "execution.completed", {
			id: executionId,
			status: "completed",
			output,
			duration
		}, env);
	}
	static async emitExecutionFailed(ensemble, executionId, error, duration, env) {
		return this.notify(ensemble, "execution.failed", {
			id: executionId,
			status: "failed",
			error: {
				message: error.message,
				stack: error.stack
			},
			duration
		}, env);
	}
	static async emitExecutionTimeout(ensemble, executionId, duration, timeout, env) {
		return this.notify(ensemble, "execution.timeout", {
			id: executionId,
			duration,
			timeout
		}, env);
	}
	static async emitAgentCompleted(ensemble, executionId, agentName, output, duration, env) {
		return this.notify(ensemble, "agent.completed", {
			executionId,
			agent: agentName,
			output,
			duration
		}, env);
	}
	static async emitStateUpdated(ensemble, executionId, state, env) {
		return this.notify(ensemble, "state.updated", {
			executionId,
			state
		}, env);
	}
};
init_observability();
var Executor = class {
	constructor(config) {
		this.env = config.env;
		this.ctx = config.ctx;
		this.agentRegistry = /* @__PURE__ */ new Map();
		this.logger = config.logger || createLogger({ serviceName: "executor" }, this.env.ANALYTICS);
	}
	registerAgent(agent) {
		this.agentRegistry.set(agent.getName(), agent);
	}
	async resolveAgent(agentRef) {
		const { name, version } = Parser.parseAgentReference(agentRef);
		if (!version) {
			const builtInRegistry = getBuiltInRegistry();
			if (builtInRegistry.isBuiltIn(name)) try {
				const config = {
					name,
					operation: builtInRegistry.getMetadata(name)?.operation || Operation.code,
					config: {}
				};
				const agent$1 = builtInRegistry.create(name, config, this.env);
				return Result.ok(agent$1);
			} catch (error) {
				return Result.err(Errors.agentConfig(name, `Failed to load built-in agent: ${error instanceof Error ? error.message : "Unknown error"}`));
			}
			const agent = this.agentRegistry.get(name);
			if (!agent) return Result.err(Errors.agentNotFound(name));
			return Result.ok(agent);
		}
		const versionedKey = `${name}@${version}`;
		if (this.agentRegistry.has(versionedKey)) {
			const agent = this.agentRegistry.get(versionedKey);
			return Result.ok(agent);
		}
		const localAgent = this.agentRegistry.get(name);
		if (localAgent) {
			this.agentRegistry.set(versionedKey, localAgent);
			return Result.ok(localAgent);
		}
		return Result.err(Errors.agentConfig(agentRef, "Versioned agent loading requires Edgit integration. Register agents manually using executor.registerAgent()"));
	}
	createAgentFromConfig(config) {
		switch (config.operation) {
			case Operation.think: return Result.ok(new ThinkAgent(config));
			case Operation.storage: return Result.ok(new DataAgent(config));
			case Operation.http: return Result.ok(new APIAgent(config));
			case Operation.email: return Result.ok(new EmailAgent(config));
			case Operation.sms: return Result.ok(new SmsMember(config));
			case Operation.form: return Result.ok(new FormAgent(config));
			case Operation.page: return Result.ok(new PageAgent(config));
			case Operation.html: return Result.ok(new HtmlMember(config));
			case Operation.pdf: return Result.ok(new PdfMember(config));
			case Operation.docs: return Result.ok(new DocsMember(config));
			case Operation.code:
				const codeAgent = CodeAgent.fromConfig(config);
				if (codeAgent) return Result.ok(codeAgent);
				const inlineAgent = FunctionAgent.fromConfig(config);
				if (inlineAgent) return Result.ok(inlineAgent);
				return Result.err(Errors.agentConfig(config.name, "Code agents require either a script:// URI or an inline handler function"));
			case Operation.tools: return Result.err(Errors.agentConfig(config.name, "MCP agent type not yet implemented"));
			case Operation.scoring: return Result.err(Errors.agentConfig(config.name, "Scoring agent type not yet implemented"));
			default: return Result.err(Errors.agentConfig(config.name, `Unknown agent operation: ${config.operation}`));
		}
	}
	async executeStep(step, flowContext, stepIndex) {
		const { ensemble, executionContext, metrics, stateManager, scoringState, ensembleScorer, scoringExecutor } = flowContext;
		const agentStartTime = Date.now();
		let resolvedInput;
		if (step.input) resolvedInput = Parser.resolveInterpolation(step.input, executionContext);
		else if (stepIndex > 0) resolvedInput = executionContext[ensemble.flow[stepIndex - 1].agent]?.output || {};
		else resolvedInput = executionContext.input || {};
		const agentResult = await this.resolveAgent(step.agent);
		if (!agentResult.success) return Result.err(new EnsembleExecutionError(ensemble.name, step.agent, agentResult.error));
		const agent = agentResult.value;
		const agentContext = {
			input: resolvedInput,
			env: this.env,
			ctx: this.ctx,
			previousOutputs: executionContext
		};
		let getPendingUpdates = null;
		if (stateManager && step.state) {
			const { context, getPendingUpdates: getUpdates } = stateManager.getStateForAgent(step.agent, step.state);
			agentContext.state = context.state;
			agentContext.setState = context.setState;
			getPendingUpdates = getUpdates;
		}
		let response;
		let scoringResult;
		if (step.scoring && scoringState && ensembleScorer) {
			const scoringConfig = step.scoring;
			const scoredResult = await scoringExecutor.executeWithScoring(async () => {
				const resp = await agent.execute(agentContext);
				if (stateManager && getPendingUpdates) {
					const { updates, newLog } = getPendingUpdates();
					flowContext.stateManager = stateManager.applyPendingUpdates(updates, newLog);
				}
				return resp;
			}, async (output, attempt, previousScore) => {
				const evaluatorResult = await this.resolveAgent(scoringConfig.evaluator);
				if (!evaluatorResult.success) throw new Error(`Failed to resolve evaluator agent: ${evaluatorResult.error.message}`);
				const evaluator = evaluatorResult.value;
				const evalContext = {
					input: {
						output: output.success ? output.data : null,
						attempt,
						previousScore,
						criteria: scoringConfig.criteria || ensemble.scoring?.criteria
					},
					env: this.env,
					ctx: this.ctx,
					previousOutputs: executionContext
				};
				const evalResponse = await evaluator.execute(evalContext);
				if (!evalResponse.success) throw new Error(`Evaluator failed: ${evalResponse.error || "Unknown error"}`);
				const evalData = evalResponse.data;
				const score = typeof evalData === "number" ? evalData : typeof evalData === "object" && evalData !== null && "score" in evalData ? evalData.score : typeof evalData === "object" && evalData !== null && "value" in evalData ? evalData.value : 0;
				return {
					score,
					passed: score >= (scoringConfig.thresholds?.minimum || ensemble.scoring?.defaultThresholds?.minimum || .7),
					feedback: typeof evalData === "object" && evalData !== null && "feedback" in evalData ? String(evalData.feedback) : typeof evalData === "object" && evalData !== null && "message" in evalData ? String(evalData.message) : "",
					breakdown: typeof evalData === "object" && evalData !== null && "breakdown" in evalData ? evalData.breakdown : {},
					metadata: {
						attempt,
						evaluator: scoringConfig.evaluator,
						timestamp: Date.now()
					}
				};
			}, scoringConfig);
			response = scoredResult.output;
			scoringResult = scoredResult.score;
			scoringState.scoreHistory.push({
				agent: step.agent,
				score: scoringResult.score,
				passed: scoringResult.passed,
				feedback: scoringResult.feedback,
				breakdown: scoringResult.breakdown,
				timestamp: Date.now(),
				attempt: scoredResult.attempts
			});
			scoringState.retryCount[step.agent] = scoredResult.attempts - 1;
			if (scoredResult.status === "max_retries_exceeded") this.logger.warn("Agent exceeded max retries", {
				agentName: step.agent,
				score: scoringResult.score,
				attempts: scoredResult.attempts,
				ensembleName: ensemble.name
			});
		} else {
			response = await agent.execute(agentContext);
			if (stateManager && getPendingUpdates) {
				const { updates, newLog } = getPendingUpdates();
				flowContext.stateManager = stateManager.applyPendingUpdates(updates, newLog);
			}
		}
		const agentDuration = Date.now() - agentStartTime;
		metrics.agents.push({
			name: step.agent,
			duration: agentDuration,
			cached: response.cached,
			success: response.success
		});
		if (response.cached) metrics.cacheHits++;
		if (!response.success) return Result.err(new AgentExecutionError(step.agent, response.error || "Unknown error", void 0));
		executionContext[step.agent] = { output: response.data };
		if (flowContext.stateManager) executionContext.state = flowContext.stateManager.getState();
		if (scoringState) executionContext.scoring = scoringState;
		return Result.ok(void 0);
	}
	async executeFlow(flowContext, startStep = 0) {
		const { ensemble, executionContext, metrics, stateManager, scoringState, ensembleScorer, startTime } = flowContext;
		for (let i = startStep; i < ensemble.flow.length; i++) {
			const step = ensemble.flow[i];
			const stepResult = await this.executeStep(step, flowContext, i);
			if (!stepResult.success) return Result.err(stepResult.error);
		}
		if (scoringState && ensembleScorer && scoringState.scoreHistory.length > 0) {
			scoringState.finalScore = ensembleScorer.calculateEnsembleScore(scoringState.scoreHistory);
			scoringState.qualityMetrics = ensembleScorer.calculateQualityMetrics(scoringState.scoreHistory);
		}
		let finalOutput;
		if (ensemble.output) finalOutput = Parser.resolveInterpolation(ensemble.output, executionContext);
		else if (ensemble.flow.length > 0) finalOutput = executionContext[ensemble.flow[ensemble.flow.length - 1].agent]?.output;
		else finalOutput = {};
		metrics.totalDuration = Date.now() - startTime;
		const stateReport = flowContext.stateManager?.getAccessReport();
		const executionOutput = {
			output: finalOutput,
			metrics,
			stateReport
		};
		if (scoringState) executionOutput.scoring = scoringState;
		return Result.ok(executionOutput);
	}
	async executeEnsemble(ensemble, input) {
		const startTime = Date.now();
		const executionId = `exec-${crypto.randomUUID()}`;
		const metrics = {
			ensemble: ensemble.name,
			totalDuration: 0,
			agents: [],
			cacheHits: 0
		};
		this.ctx.waitUntil(NotificationManager.emitExecutionStarted(ensemble, executionId, input, this.env));
		const stateManager = ensemble.state ? new StateManager(ensemble.state) : null;
		let scoringState = null;
		let ensembleScorer = null;
		const scoringExecutor = new ScoringExecutor();
		if (ensemble.scoring?.enabled) {
			ensembleScorer = new EnsembleScorer(ensemble.scoring);
			scoringState = {
				scoreHistory: [],
				retryCount: {},
				qualityMetrics: void 0,
				finalScore: void 0
			};
		}
		const flowContext = {
			ensemble,
			executionContext: {
				input,
				state: stateManager ? stateManager.getState() : {},
				scoring: scoringState || {}
			},
			metrics,
			stateManager,
			scoringState,
			ensembleScorer,
			scoringExecutor,
			startTime
		};
		const result = await this.executeFlow(flowContext, 0);
		if (result.success) this.ctx.waitUntil(NotificationManager.emitExecutionCompleted(ensemble, executionId, result.value.output, result.value.metrics.totalDuration, this.env));
		else {
			const error = new Error(result.error.message);
			error.stack = result.error.stack;
			this.ctx.waitUntil(NotificationManager.emitExecutionFailed(ensemble, executionId, error, Date.now() - startTime, this.env));
		}
		return result;
	}
	async executeFromYAML(yamlContent, input) {
		const parseResult = Result.fromThrowable(() => Parser.parseEnsemble(yamlContent));
		if (!parseResult.success) return Result.err(Errors.ensembleParse("unknown", parseResult.error.message));
		const ensemble = parseResult.value;
		const availableMembers = new Set(this.agentRegistry.keys());
		const validationResult = Result.fromThrowable(() => Parser.validateAgentReferences(ensemble, availableMembers));
		if (!validationResult.success) return Result.err(Errors.ensembleParse(ensemble.name, validationResult.error.message));
		return await this.executeEnsemble(ensemble, input);
	}
	getRegisteredMembers() {
		const builtInNames = getBuiltInRegistry().getAvailableNames();
		const userDefinedNames = Array.from(this.agentRegistry.keys());
		const allNames = new Set([...builtInNames, ...userDefinedNames]);
		return Array.from(allNames);
	}
	hasMember(agentName) {
		return getBuiltInRegistry().isBuiltIn(agentName) || this.agentRegistry.has(agentName);
	}
	getBuiltInMembers() {
		return getBuiltInRegistry().list();
	}
	async resumeExecution(suspendedState, resumeInput) {
		const ensemble = suspendedState.ensemble;
		const executionContext = suspendedState.executionContext;
		if (resumeInput) executionContext.resumeInput = resumeInput;
		let stateManager = null;
		if (suspendedState.stateSnapshot) {
			if (ensemble.state) stateManager = new StateManager(ensemble.state);
		}
		let scoringState = null;
		let ensembleScorer = null;
		const scoringExecutor = new ScoringExecutor();
		if (suspendedState.scoringSnapshot) {
			scoringState = suspendedState.scoringSnapshot;
			if (ensemble.scoring?.enabled) ensembleScorer = new EnsembleScorer(ensemble.scoring);
		}
		const metrics = {
			ensemble: ensemble.name,
			totalDuration: 0,
			agents: suspendedState.metrics.agents || [],
			cacheHits: suspendedState.metrics.cacheHits || 0
		};
		const startTime = suspendedState.metrics.startTime || Date.now();
		if (stateManager) executionContext.state = stateManager.getState();
		if (scoringState) executionContext.scoring = scoringState;
		const flowContext = {
			ensemble,
			executionContext,
			metrics,
			stateManager,
			scoringState,
			ensembleScorer,
			scoringExecutor,
			startTime
		};
		const resumeFromStep = suspendedState.resumeFromStep;
		return await this.executeFlow(flowContext, resumeFromStep);
	}
};
var MemberLoader = class {
	constructor(config) {
		this.config = {
			membersDir: config.membersDir || "./agents",
			ensemblesDir: config.ensemblesDir || "./ensembles",
			env: config.env,
			ctx: config.ctx
		};
		this.loadedMembers = /* @__PURE__ */ new Map();
	}
	registerAgent(agentConfig, implementation) {
		const config = typeof agentConfig === "string" ? Parser.parseAgent(agentConfig) : agentConfig;
		const instance = this.createMemberInstance(config, implementation);
		this.loadedMembers.set(config.name, {
			config,
			instance
		});
		return instance;
	}
	async loadMemberFromEdgit(memberRef) {
		const { name, version } = Parser.parseAgentReference(memberRef);
		if (!version) throw new Error(`Agent reference must include version: ${memberRef}`);
		const versionedKey = `${name}@${version}`;
		if (this.loadedMembers.has(versionedKey)) return this.loadedMembers.get(versionedKey).instance;
		throw new Error(`Cannot load versioned agent from Edgit: ${memberRef}. Edgit integration not yet available. Use loader.registerAgent() for now.`);
	}
	createMemberInstance(config, implementation) {
		switch (config.operation) {
			case "code":
				if (!implementation) throw new Error(`Code agent "${config.name}" requires an implementation function`);
				return new FunctionAgent(config, implementation);
			case "think": return new ThinkAgent(config);
			case "storage": return new DataAgent(config);
			case "http": return new APIAgent(config);
			case "tools": throw new Error("Tools agent type not yet implemented");
			case "scoring": throw new Error("Scoring agent type not yet implemented");
			default: throw new Error(`Unknown agent type: ${config.operation}`);
		}
	}
	getAgent(name) {
		return this.loadedMembers.get(name)?.instance;
	}
	getAllMembers() {
		return Array.from(this.loadedMembers.values()).map((m) => m.instance);
	}
	getMemberNames() {
		return Array.from(this.loadedMembers.keys());
	}
	hasMember(name) {
		return this.loadedMembers.has(name);
	}
	clear() {
		this.loadedMembers.clear();
	}
};
function createLoader(config) {
	return new MemberLoader(config);
}
var PageRouter = class {
	constructor(config = {}) {
		this.routes = [];
		this.pages = /* @__PURE__ */ new Map();
		this.config = {
			pagesDir: config.pagesDir || "./pages",
			autoRoute: config.autoRoute !== false,
			basePath: config.basePath || "",
			indexFiles: config.indexFiles || ["index", "home"],
			notFoundPage: config.notFoundPage || "error-404",
			beforeRender: config.beforeRender
		};
	}
	registerPage(pageConfig, pageMember) {
		const routeConfig = pageConfig?.route || pageConfig.config?.route;
		if (!routeConfig) return;
		const path$1 = this.normalizePath(routeConfig.path || `/${pageConfig.name}`);
		const params = this.extractParams(path$1);
		const route = {
			path: path$1,
			methods: routeConfig.methods || ["GET"],
			page: pageMember,
			params,
			aliases: routeConfig.aliases?.map((a) => this.normalizePath(a)),
			auth: routeConfig.auth,
			rateLimit: routeConfig.rateLimit
		};
		this.routes.push(route);
		if (route.aliases) for (const alias of route.aliases) this.routes.push({
			...route,
			path: alias,
			aliases: void 0
		});
	}
	async discoverPages(pagesMap) {
		if (!this.config.autoRoute) return;
		for (const [pageName, { config, agent }] of pagesMap) {
			this.pages.set(pageName, agent);
			if (config?.route || config.config?.route) {
				this.registerPage(config, agent);
				continue;
			}
			let path$1 = this.pageNameToPath(pageName);
			path$1 = this.normalizePath(path$1);
			const params = this.extractParams(path$1);
			this.routes.push({
				path: path$1,
				methods: ["GET"],
				page: agent,
				params
			});
		}
		this.routes.sort((a, b) => {
			const aStatic = !a.params || a.params.length === 0;
			const bStatic = !b.params || b.params.length === 0;
			if (aStatic && !bStatic) return -1;
			if (!aStatic && bStatic) return 1;
			return b.path.length - a.path.length;
		});
	}
	async handle(request, env, ctx) {
		const url = new URL(request.url);
		const pathname = this.normalizePath(url.pathname);
		const method = request.method;
		const match = this.findRoute(pathname, method);
		if (!match) {
			if (this.config.notFoundPage) return this.render404(request, env, ctx);
			return null;
		}
		const { route, params } = match;
		if (route.auth === "required") {
			if (!(await this.checkAuth(request, env)).authorized) return new Response("Unauthorized", { status: 401 });
		}
		if (route.rateLimit) {
			if (!await this.checkRateLimit(request, route.rateLimit, env)) return new Response("Too Many Requests", { status: 429 });
		}
		const query = {};
		for (const [key, value] of url.searchParams) query[key] = value;
		const headers = {};
		request.headers.forEach((value, key) => {
			headers[key] = value;
		});
		let input = {
			params,
			query,
			headers,
			request,
			env,
			ctx
		};
		if (this.config.beforeRender) {
			const customData = await this.config.beforeRender(route.page, request, env);
			input = {
				...input,
				...customData
			};
		}
		try {
			const result = await route.page.execute({
				input,
				env,
				ctx,
				state: {},
				previousOutputs: {}
			});
			if (!result.success) {
				console.error("Page render error:", result.error);
				return new Response("Internal Server Error", { status: 500 });
			}
			const pageOutput = result.output || result.data;
			return new Response(pageOutput.html, {
				status: 200,
				headers: pageOutput.headers
			});
		} catch (error) {
			console.error("Page execution error:", error);
			return new Response("Internal Server Error", { status: 500 });
		}
	}
	findRoute(pathname, method) {
		for (const route of this.routes) {
			if (!route.methods.includes(method)) continue;
			const match = this.matchPath(pathname, route.path);
			if (match) return {
				route,
				params: match
			};
		}
		return null;
	}
	matchPath(pathname, pattern) {
		const pathParts = pathname.split("/").filter(Boolean);
		const patternParts = pattern.split("/").filter(Boolean);
		if (pathParts.length !== patternParts.length) return null;
		const params = {};
		for (let i = 0; i < patternParts.length; i++) {
			const patternPart = patternParts[i];
			const pathPart = pathParts[i];
			if (patternPart.startsWith(":")) {
				const paramName = patternPart.slice(1);
				params[paramName] = decodeURIComponent(pathPart);
			} else if (patternPart !== pathPart) return null;
		}
		return params;
	}
	extractParams(path$1) {
		const params = [];
		const parts = path$1.split("/").filter(Boolean);
		for (const part of parts) if (part.startsWith(":")) params.push(part.slice(1));
		return params;
	}
	pageNameToPath(name) {
		if (this.config.indexFiles?.includes(name)) return "/";
		let path$1 = name.replace(/\./g, "/").replace(/\[([^\]]+)\]/g, ":$1");
		for (const indexFile of this.config.indexFiles || []) if (path$1.endsWith(`/${indexFile}`) || path$1.endsWith(`-${indexFile}`)) {
			path$1 = path$1.replace(/* @__PURE__ */ new RegExp(`[/-]${indexFile}$`), "");
			break;
		}
		return path$1 || "/";
	}
	normalizePath(path$1) {
		const basePath = this.config.basePath || "";
		path$1 = path$1.startsWith("/") ? path$1 : `/${path$1}`;
		path$1 = path$1.endsWith("/") && path$1 !== "/" ? path$1.slice(0, -1) : path$1;
		return basePath ? `${basePath}${path$1}` : path$1;
	}
	async checkAuth(request, env) {
		return { authorized: !!request.headers.get("Authorization") };
	}
	async checkRateLimit(request, limit$1, env) {
		return true;
	}
	async render404(request, env, ctx) {
		const notFoundPageName = this.config.notFoundPage;
		if (!notFoundPageName) return new Response("Not Found", { status: 404 });
		const notFoundPage = this.pages.get(notFoundPageName);
		if (!notFoundPage) {
			console.warn(`404 page "${notFoundPageName}" not found in pages map`);
			return new Response("Not Found", { status: 404 });
		}
		try {
			const result = await notFoundPage.execute({
				input: {
					message: null,
					searchEnabled: false,
					helpfulLinks: []
				},
				env,
				ctx,
				state: {},
				previousOutputs: {}
			});
			if (!result.success) {
				console.error("404 page render error:", result.error);
				return new Response("Not Found", { status: 404 });
			}
			const pageOutput = result.output || result.data;
			return new Response(pageOutput.html, {
				status: 404,
				headers: pageOutput.headers
			});
		} catch (error) {
			console.error("404 page execution error:", error);
			return new Response("Not Found", { status: 404 });
		}
	}
	getRoutes() {
		return [...this.routes];
	}
};
var BearerValidator = class {
	constructor(config = {}) {
		this.config = config;
	}
	extractToken(request) {
		const authHeader = request.headers.get("Authorization");
		if (!authHeader?.startsWith("Bearer ")) return null;
		return authHeader.substring(7);
	}
	decodeToken(token) {
		try {
			const parts = token.split(".");
			if (parts.length !== 3) return null;
			return JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
		} catch (error) {
			return null;
		}
	}
	async verifyToken(token) {
		if (this.config.customDecoder) try {
			return await this.config.customDecoder(token);
		} catch (error) {
			return null;
		}
		const payload = this.decodeToken(token);
		if (!payload) return null;
		if (payload.exp && Date.now() / 1e3 > payload.exp) return null;
		if (this.config.issuer && payload.iss !== this.config.issuer) return null;
		if (this.config.audience && payload.aud !== this.config.audience) return null;
		return payload;
	}
	async validate(request, env) {
		const token = this.extractToken(request);
		if (!token) return {
			valid: false,
			error: "invalid_token",
			message: "No bearer token provided"
		};
		const payload = await this.verifyToken(token);
		if (!payload) return {
			valid: false,
			error: "invalid_token",
			message: "Invalid or expired bearer token"
		};
		const context = {
			authenticated: true,
			method: "bearer",
			token,
			user: {
				id: payload.sub,
				email: payload.email,
				roles: payload.roles || [],
				permissions: payload.permissions || [],
				metadata: {}
			},
			expiresAt: payload.exp
		};
		const standardClaims = [
			"sub",
			"email",
			"roles",
			"permissions",
			"exp",
			"iat",
			"iss",
			"aud"
		];
		for (const [key, value] of Object.entries(payload)) if (!standardClaims.includes(key)) context.user.metadata[key] = value;
		return {
			valid: true,
			context
		};
	}
};
function createBearerValidator(env) {
	if (!env.JWT_SECRET && !env.JWT_PUBLIC_KEY_URL) return null;
	return new BearerValidator({
		secret: env.JWT_SECRET,
		publicKeyUrl: env.JWT_PUBLIC_KEY_URL,
		issuer: env.JWT_ISSUER,
		audience: env.JWT_AUDIENCE,
		algorithms: env.JWT_ALGORITHMS ? env.JWT_ALGORITHMS.split(",") : ["HS256", "RS256"]
	});
}
var ApiKeyValidator = class {
	constructor(config) {
		this.config = config;
	}
	extractToken(request) {
		const sources = this.config.sources || ["header", "query"];
		const headerName = this.config.headerName || "X-API-Key";
		const queryName = this.config.queryName || "api_key";
		const cookieName = this.config.cookieName || "api_key";
		if (sources.includes("header")) {
			const headerValue = request.headers.get(headerName);
			if (headerValue) return headerValue;
		}
		if (sources.includes("query")) {
			const queryValue = new URL(request.url).searchParams.get(queryName);
			if (queryValue) return queryValue;
		}
		if (sources.includes("cookie")) {
			const cookieHeader = request.headers.get("Cookie");
			if (cookieHeader) {
				const cookies = cookieHeader.split(";").map((c) => c.trim());
				for (const cookie of cookies) {
					const [name, value] = cookie.split("=");
					if (name === cookieName && value) return decodeURIComponent(value);
				}
			}
		}
		return null;
	}
	isValidFormat(apiKey) {
		if (!apiKey) return false;
		if (this.config.prefix && !apiKey.startsWith(this.config.prefix)) return false;
		return apiKey.length >= 8 && apiKey.length <= 256;
	}
	async validate(request, env) {
		const apiKey = this.extractToken(request);
		if (!apiKey) return {
			valid: false,
			error: "invalid_token",
			message: "No API key provided"
		};
		if (!this.isValidFormat(apiKey)) return {
			valid: false,
			error: "invalid_token",
			message: "Invalid API key format"
		};
		const kv = env[this.config.kvNamespace];
		if (!kv) {
			console.error(`KV namespace "${this.config.kvNamespace}" not found in env`);
			return {
				valid: false,
				error: "unknown",
				message: "Authentication service error"
			};
		}
		try {
			const metadataJson = await kv.get(apiKey);
			if (!metadataJson) return {
				valid: false,
				error: "invalid_token",
				message: "Invalid API key"
			};
			const metadata = JSON.parse(metadataJson);
			if (metadata.expiresAt && Date.now() > metadata.expiresAt) return {
				valid: false,
				error: "expired",
				message: "API key has expired"
			};
			return {
				valid: true,
				context: {
					authenticated: true,
					method: "apiKey",
					token: apiKey,
					user: {
						id: metadata.userId || metadata.keyId,
						permissions: metadata.permissions || [],
						roles: [],
						metadata: {
							...metadata.metadata,
							keyId: metadata.keyId,
							keyName: metadata.name
						}
					},
					expiresAt: metadata.expiresAt
				},
				ratelimit: metadata.rateLimit ? {
					limit: metadata.rateLimit.requests,
					remaining: metadata.rateLimit.requests,
					reset: Math.floor(Date.now() / 1e3) + metadata.rateLimit.window
				} : void 0
			};
		} catch (error) {
			console.error("API key validation error:", error);
			return {
				valid: false,
				error: "unknown",
				message: "Authentication validation failed"
			};
		}
	}
};
function createApiKeyValidator(env) {
	const kvNamespace = env.API_KEY_KV_NAMESPACE || "API_KEYS";
	if (!env[kvNamespace]) return null;
	return new ApiKeyValidator({
		kvNamespace,
		sources: env.API_KEY_SOURCES ? env.API_KEY_SOURCES.split(",") : ["header", "query"],
		headerName: env.API_KEY_HEADER_NAME || "X-API-Key",
		queryName: env.API_KEY_QUERY_NAME || "api_key",
		cookieName: env.API_KEY_COOKIE_NAME || "api_key",
		prefix: env.API_KEY_PREFIX,
		stealthMode: env.API_KEY_STEALTH_MODE === "true"
	});
}
var CookieValidator = class {
	constructor(config) {
		this.config = config;
	}
	extractToken(request) {
		const cookieName = this.config.cookieName || "session_token";
		const cookieHeader = request.headers.get("Cookie");
		if (!cookieHeader) return null;
		const cookies = cookieHeader.split(";").map((c) => c.trim());
		for (const cookie of cookies) {
			const [name, value] = cookie.split("=");
			if (name === cookieName && value) return decodeURIComponent(value);
		}
		return null;
	}
	isValidFormat(token) {
		return Boolean(token && token.length >= 16 && token.length <= 512);
	}
	async validate(request, env) {
		const sessionToken = this.extractToken(request);
		if (!sessionToken) return {
			valid: false,
			error: "invalid_token",
			message: "No session token provided"
		};
		if (!this.isValidFormat(sessionToken)) return {
			valid: false,
			error: "invalid_token",
			message: "Invalid session token format"
		};
		const kv = env[this.config.kvNamespace];
		if (!kv) {
			console.error(`KV namespace "${this.config.kvNamespace}" not found in env`);
			return {
				valid: false,
				error: "unknown",
				message: "Authentication service error"
			};
		}
		try {
			const sessionJson = await kv.get(`session:${sessionToken}`);
			if (!sessionJson) return {
				valid: false,
				error: "invalid_token",
				message: "Invalid or expired session"
			};
			const session = JSON.parse(sessionJson);
			if (session.expiresAt && Date.now() > session.expiresAt) {
				await kv.delete(`session:${sessionToken}`);
				return {
					valid: false,
					error: "expired",
					message: "Session has expired"
				};
			}
			return {
				valid: true,
				context: {
					authenticated: true,
					method: "cookie",
					token: sessionToken,
					user: {
						id: session.userId,
						email: session.email,
						roles: session.roles || [],
						permissions: session.permissions || [],
						metadata: {
							...session.metadata,
							sessionId: session.sessionId,
							sessionCreated: session.createdAt
						}
					},
					expiresAt: session.expiresAt
				}
			};
		} catch (error) {
			console.error("Cookie session validation error:", error);
			return {
				valid: false,
				error: "unknown",
				message: "Authentication validation failed"
			};
		}
	}
	createCookie(sessionToken, options) {
		const parts = [`${this.config.cookieName || "session_token"}=${encodeURIComponent(sessionToken)}`];
		if (this.config.domain) parts.push(`Domain=${this.config.domain}`);
		if (this.config.path || this.config.path === "") parts.push(`Path=${this.config.path}`);
		else parts.push("Path=/");
		if (options?.maxAge !== void 0) parts.push(`Max-Age=${options.maxAge}`);
		else if (options?.expires) parts.push(`Expires=${options.expires.toUTCString()}`);
		if (this.config.secure !== false) parts.push("Secure");
		if (this.config.httpOnly !== false) parts.push("HttpOnly");
		const sameSite = this.config.sameSite || "lax";
		parts.push(`SameSite=${sameSite.charAt(0).toUpperCase() + sameSite.slice(1)}`);
		return parts.join("; ");
	}
	async createSession(kv, sessionData) {
		const sessionToken = crypto.randomUUID();
		const sessionId = crypto.randomUUID();
		const now = Date.now();
		const ttl = this.config.sessionTTL || 86400;
		const expiresAt = sessionData.expiresAt || now + ttl * 1e3;
		const session = {
			...sessionData,
			sessionId,
			createdAt: now,
			expiresAt
		};
		await kv.put(`session:${sessionToken}`, JSON.stringify(session), { expirationTtl: ttl });
		return sessionToken;
	}
	async deleteSession(kv, sessionToken) {
		await kv.delete(`session:${sessionToken}`);
	}
};
function createCookieValidator(env) {
	const kvNamespace = env.SESSION_KV_NAMESPACE || "SESSIONS";
	if (!env[kvNamespace]) return null;
	return new CookieValidator({
		kvNamespace,
		cookieName: env.SESSION_COOKIE_NAME || "session_token",
		domain: env.SESSION_COOKIE_DOMAIN,
		path: env.SESSION_COOKIE_PATH || "/",
		secure: env.SESSION_COOKIE_SECURE !== "false",
		httpOnly: env.SESSION_COOKIE_HTTP_ONLY !== "false",
		sameSite: env.SESSION_COOKIE_SAME_SITE || "lax",
		sessionTTL: env.SESSION_TTL ? parseInt(env.SESSION_TTL) : 86400
	});
}
var UnkeyValidator = class {
	constructor(config) {
		this.config = config;
	}
	extractToken(request) {
		const apiKeyHeader = request.headers.get("X-API-Key");
		if (apiKeyHeader) return apiKeyHeader;
		const authHeader = request.headers.get("Authorization");
		if (authHeader?.startsWith("Bearer ")) return authHeader.substring(7);
		const apiKeyQuery = new URL(request.url).searchParams.get("api_key");
		if (apiKeyQuery) return apiKeyQuery;
		return null;
	}
	isValidKeyFormat(apiKey) {
		if (!apiKey) return false;
		if (this.config.keyPrefix && this.config.keyPrefix.length > 0) return this.config.keyPrefix.some((prefix) => apiKey.startsWith(prefix));
		return true;
	}
	isServiceAccount(apiKey) {
		return Boolean(apiKey && apiKey.includes("_service"));
	}
	async validate(request, env) {
		const apiKey = this.extractToken(request);
		if (!apiKey) return {
			valid: false,
			error: "invalid_token",
			message: "No API key provided"
		};
		if (!this.isValidKeyFormat(apiKey)) return {
			valid: false,
			error: "invalid_token",
			message: "Invalid API key format"
		};
		try {
			const response = await fetch("https://api.unkey.dev/v1/keys.verifyKey", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${this.config.rootKey}`,
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					...this.config.apiId && { apiId: this.config.apiId },
					key: apiKey
				})
			});
			if (!response.ok) {
				console.error("Unkey API error:", response.status, response.statusText);
				return {
					valid: false,
					error: "unknown",
					message: "Authentication service error"
				};
			}
			const result = await response.json();
			if (!result.valid) {
				if (result.code === "RATE_LIMITED" || result.ratelimit && result.ratelimit.remaining <= 0) return {
					valid: false,
					error: "rate_limited",
					message: "Rate limit exceeded",
					ratelimit: result.ratelimit
				};
				return {
					valid: false,
					error: "invalid_token",
					message: "Invalid API key"
				};
			}
			return {
				valid: true,
				context: {
					authenticated: true,
					method: "unkey",
					token: apiKey,
					user: {
						id: result.ownerId || "unknown",
						permissions: result.permissions || [],
						metadata: result.meta || {}
					},
					unkey: {
						keyId: result.keyId,
						ownerId: result.ownerId,
						isServiceAccount: this.isServiceAccount(apiKey),
						ratelimit: result.ratelimit
					}
				},
				ratelimit: result.ratelimit
			};
		} catch (error) {
			console.error("Unkey validation error:", error);
			return {
				valid: false,
				error: "unknown",
				message: "Authentication validation failed"
			};
		}
	}
};
function createUnkeyValidator(env) {
	if (!env.UNKEY_ROOT_KEY) return null;
	return new UnkeyValidator({
		rootKey: env.UNKEY_ROOT_KEY,
		apiId: env.UNKEY_API_ID,
		keyPrefix: env.UNKEY_KEY_PREFIX ? env.UNKEY_KEY_PREFIX.split(",") : ["ownerco_", "oiq_"],
		stealthMode: env.UNKEY_STEALTH_MODE === "true"
	});
}
var StripeSignatureValidator = class {
	constructor(webhookSecret) {
		this.webhookSecret = webhookSecret;
	}
	extractToken(request) {
		return request.headers.get("stripe-signature");
	}
	async validate(request, env) {
		const signature = this.extractToken(request);
		if (!signature) return {
			valid: false,
			error: "invalid_token",
			message: "Missing Stripe signature"
		};
		const body = await request.text();
		if (!await this.verifyStripeSignature(body, signature)) return {
			valid: false,
			error: "invalid_token",
			message: "Invalid Stripe signature"
		};
		return {
			valid: true,
			context: {
				authenticated: true,
				method: "custom",
				custom: {
					provider: "stripe",
					signature
				}
			}
		};
	}
	async verifyStripeSignature(payload, signature) {
		try {
			const elements = signature.split(",");
			const signatureData = {};
			for (const element of elements) {
				const [key, value] = element.split("=");
				signatureData[key] = value;
			}
			const timestamp$1 = signatureData["t"];
			const signatures = [signatureData["v1"]];
			if (!timestamp$1 || !signatures[0]) return false;
			if (Math.floor(Date.now() / 1e3) - parseInt(timestamp$1) > 300) return false;
			const signedPayload = `${timestamp$1}.${payload}`;
			const expectedSignature = await this.computeHMAC(signedPayload, this.webhookSecret);
			return signatures.some((sig) => this.secureCompare(sig, expectedSignature));
		} catch (error) {
			console.error("Stripe signature verification error:", error);
			return false;
		}
	}
	async computeHMAC(data, secret) {
		const encoder = new TextEncoder();
		const keyData = encoder.encode(secret);
		const messageData = encoder.encode(data);
		const key = await crypto.subtle.importKey("raw", keyData, {
			name: "HMAC",
			hash: "SHA-256"
		}, false, ["sign"]);
		const signature = await crypto.subtle.sign("HMAC", key, messageData);
		return Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("");
	}
	secureCompare(a, b) {
		if (a.length !== b.length) return false;
		let result = 0;
		for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
		return result === 0;
	}
};
var GitHubSignatureValidator = class {
	constructor(webhookSecret) {
		this.webhookSecret = webhookSecret;
	}
	extractToken(request) {
		return request.headers.get("x-hub-signature-256");
	}
	async validate(request, env) {
		const signature = this.extractToken(request);
		if (!signature) return {
			valid: false,
			error: "invalid_token",
			message: "Missing GitHub signature"
		};
		const body = await request.text();
		if (!await this.verifyGitHubSignature(body, signature)) return {
			valid: false,
			error: "invalid_token",
			message: "Invalid GitHub signature"
		};
		return {
			valid: true,
			context: {
				authenticated: true,
				method: "custom",
				custom: {
					provider: "github",
					signature
				}
			}
		};
	}
	async verifyGitHubSignature(payload, signature) {
		try {
			if (!signature.startsWith("sha256=")) return false;
			const receivedSignature = signature.substring(7);
			const expectedSignature = await this.computeHMAC(payload, this.webhookSecret);
			return this.secureCompare(receivedSignature, expectedSignature);
		} catch (error) {
			console.error("GitHub signature verification error:", error);
			return false;
		}
	}
	async computeHMAC(data, secret) {
		const encoder = new TextEncoder();
		const keyData = encoder.encode(secret);
		const messageData = encoder.encode(data);
		const key = await crypto.subtle.importKey("raw", keyData, {
			name: "HMAC",
			hash: "SHA-256"
		}, false, ["sign"]);
		const signature = await crypto.subtle.sign("HMAC", key, messageData);
		return Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("");
	}
	secureCompare(a, b) {
		if (a.length !== b.length) return false;
		let result = 0;
		for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
		return result === 0;
	}
};
var TwilioSignatureValidator = class {
	constructor(authToken) {
		this.authToken = authToken;
	}
	extractToken(request) {
		return request.headers.get("x-twilio-signature");
	}
	async validate(request, env) {
		const signature = this.extractToken(request);
		if (!signature) return {
			valid: false,
			error: "invalid_token",
			message: "Missing Twilio signature"
		};
		const url = request.url;
		const body = await request.text();
		if (!await this.verifyTwilioSignature(url, body, signature)) return {
			valid: false,
			error: "invalid_token",
			message: "Invalid Twilio signature"
		};
		return {
			valid: true,
			context: {
				authenticated: true,
				method: "custom",
				custom: {
					provider: "twilio",
					signature
				}
			}
		};
	}
	async verifyTwilioSignature(url, body, signature) {
		try {
			const params = new URLSearchParams(body);
			const sortedParams = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b));
			let data = url;
			for (const [key, value] of sortedParams) data += key + value;
			const expectedSignature = await this.computeHMAC(data, this.authToken);
			return this.secureCompare(signature, expectedSignature);
		} catch (error) {
			console.error("Twilio signature verification error:", error);
			return false;
		}
	}
	async computeHMAC(data, secret) {
		const encoder = new TextEncoder();
		const keyData = encoder.encode(secret);
		const messageData = encoder.encode(data);
		const key = await crypto.subtle.importKey("raw", keyData, {
			name: "HMAC",
			hash: "SHA-1"
		}, false, ["sign"]);
		const signature = await crypto.subtle.sign("HMAC", key, messageData);
		const bytes = new Uint8Array(signature);
		let binary$1 = "";
		for (let i = 0; i < bytes.length; i++) binary$1 += String.fromCharCode(bytes[i]);
		return btoa(binary$1);
	}
	secureCompare(a, b) {
		if (a.length !== b.length) return false;
		let result = 0;
		for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
		return result === 0;
	}
};
var CustomValidatorRegistry = class {
	constructor() {
		this.validators = /* @__PURE__ */ new Map();
	}
	register(name, validator) {
		this.validators.set(name, validator);
	}
	get(name) {
		return this.validators.get(name);
	}
	has(name) {
		return this.validators.has(name);
	}
	registerBuiltIn(env) {
		if (env.STRIPE_WEBHOOK_SECRET) this.register("stripe-signature", new StripeSignatureValidator(env.STRIPE_WEBHOOK_SECRET));
		if (env.GITHUB_WEBHOOK_SECRET) this.register("github-signature", new GitHubSignatureValidator(env.GITHUB_WEBHOOK_SECRET));
		if (env.TWILIO_AUTH_TOKEN) this.register("twilio-signature", new TwilioSignatureValidator(env.TWILIO_AUTH_TOKEN));
	}
};
function createCustomValidatorRegistry(env) {
	const registry$1 = new CustomValidatorRegistry();
	registry$1.registerBuiltIn(env);
	return registry$1;
}
var UnifiedRouter = class {
	constructor(config = {}) {
		this.routes = [];
		this.validators = /* @__PURE__ */ new Map();
		this.config = config;
		this.customValidatorRegistry = new CustomValidatorRegistry();
	}
	async init(env) {
		const bearer = createBearerValidator(env);
		if (bearer) this.validators.set("bearer", bearer);
		const apiKey = createApiKeyValidator(env);
		if (apiKey) this.validators.set("apiKey", apiKey);
		const cookie = createCookieValidator(env);
		if (cookie) this.validators.set("cookie", cookie);
		const unkey = createUnkeyValidator(env);
		if (unkey) this.validators.set("unkey", unkey);
		this.customValidatorRegistry = createCustomValidatorRegistry(env);
	}
	register(options) {
		let pattern = options.pattern;
		let path$1 = options.path || options.pattern;
		if (pattern === "default" || pattern === "auto") if (options.memberPath) {
			pattern = this.resolveDefaultPath(options.memberPath, options.operation);
			path$1 = pattern;
		} else {
			pattern = `/${options.operation}s/${options.agentName}`;
			path$1 = pattern;
		}
		const route = {
			pattern,
			path: path$1,
			methods: options.methods,
			operation: options.operation,
			agentName: options.agentName,
			auth: options.auth,
			priority: options.priority,
			handler: options.handler
		};
		this.routes.push(route);
		this.routes.sort((a, b) => {
			const aPrio = a.priority ?? this.getDefaultPriority(a.operation);
			const bPrio = b.priority ?? this.getDefaultPriority(b.operation);
			if (aPrio !== bPrio) return aPrio - bPrio;
			const aStatic = !a.pattern.includes(":") && !a.pattern.includes("*");
			const bStatic = !b.pattern.includes(":") && !b.pattern.includes("*");
			if (aStatic && !bStatic) return -1;
			if (!aStatic && bStatic) return 1;
			return b.pattern.length - a.pattern.length;
		});
	}
	resolveDefaultPath(memberPath, operation) {
		let path$1 = memberPath.replace(/\.(yaml|yml|ts|js|tsx|jsx)$/, "").replace(/\/(agent|page|ensemble|form|api)$/, "");
		for (const prefix of [
			"/pages/",
			"/agents/",
			"/ensembles/",
			"/forms/",
			"/apis/",
			"/webhooks/",
			"/docs/"
		]) if (path$1.startsWith(prefix)) {
			path$1 = path$1.substring(prefix.length - 1);
			break;
		}
		if (!path$1.startsWith("/")) path$1 = "/" + path$1;
		if (path$1.endsWith("/index")) path$1 = path$1.substring(0, path$1.length - 6) || "/";
		return path$1;
	}
	getDefaultPriority(operation) {
		return {
			static: 1,
			health: 2,
			auth: 3,
			api: 50,
			webhook: 60,
			docs: 70,
			page: 80,
			form: 90
		}[operation] || 100;
	}
	matchPattern(pattern, path$1) {
		pattern = pattern.replace(/\/+$/, "") || "/";
		path$1 = path$1.replace(/\/+$/, "") || "/";
		if (pattern.endsWith("*")) {
			const prefix = pattern.slice(0, -1);
			if (path$1.startsWith(prefix)) return {};
			return null;
		}
		if (!pattern.includes(":")) return pattern === path$1 ? {} : null;
		const patternParts = pattern.split("/");
		const pathParts = path$1.split("/");
		if (patternParts.length !== pathParts.length) return null;
		const params = {};
		for (let i = 0; i < patternParts.length; i++) {
			const patternPart = patternParts[i];
			const pathPart = pathParts[i];
			if (patternPart.startsWith(":")) {
				const paramName = patternPart.slice(1);
				params[paramName] = decodeURIComponent(pathPart);
			} else if (patternPart !== pathPart) return null;
		}
		return params;
	}
	match(path$1, method) {
		for (const route of this.routes) {
			if (!route.methods.includes(method) && !route.methods.includes("*")) continue;
			const params = this.matchPattern(route.pattern, path$1);
			if (params === null) continue;
			const auth = this.resolveAuthConfig(route.pattern, route.operation, route.auth);
			return {
				pattern: route.pattern,
				params,
				auth,
				operation: route.operation,
				priority: route.priority ?? this.getDefaultPriority(route.operation)
			};
		}
		return null;
	}
	resolveAuthConfig(path$1, operation, memberAuth) {
		let resolved = {};
		let source = "global-default";
		if (this.config.routing?.auth?.global) resolved = { ...this.config.routing.auth.global };
		const typeDefaults = this.config.routing?.auth?.defaults;
		if (typeDefaults) {
			const typeKey = {
				page: "pages",
				api: "api",
				webhook: "webhooks",
				form: "forms",
				docs: "docs",
				static: "pages",
				health: "api",
				auth: "api"
			}[operation];
			if (typeKey && typeDefaults[typeKey]) {
				resolved = {
					...resolved,
					...typeDefaults[typeKey]
				};
				source = "type-default";
			}
		}
		const rules = this.config.routing?.auth?.rules || [];
		for (const rule of rules) if (this.matchPattern(rule.pattern, path$1)) {
			resolved = {
				...resolved,
				...rule.auth
			};
			if (rule.rateLimit) resolved.rateLimit = rule.rateLimit;
			source = "rule";
			break;
		}
		if (memberAuth) {
			resolved = {
				...resolved,
				...memberAuth
			};
			source = "agent";
		}
		if (!resolved.requirement) resolved.requirement = "required";
		return {
			requirement: resolved.requirement,
			methods: resolved.methods,
			permissions: resolved.permissions,
			roles: resolved.roles,
			serviceAccountOnly: resolved.serviceAccountOnly,
			stealthMode: resolved.stealthMode,
			customValidator: resolved.customValidator,
			onFailure: resolved.onFailure,
			auditLog: resolved.auditLog,
			source,
			rateLimit: resolved.rateLimit
		};
	}
	async authenticate(request, env, auth) {
		if (auth.requirement === "public") return {
			valid: true,
			context: {
				authenticated: false,
				method: void 0
			}
		};
		const methods = auth.methods || [
			"bearer",
			"apiKey",
			"cookie"
		];
		if (auth.customValidator) {
			const validator = this.customValidatorRegistry.get(auth.customValidator);
			if (validator) {
				const result = await validator.validate(request, env);
				if (result.valid) return result;
			}
		}
		for (const method of methods) {
			const validator = this.validators.get(method);
			if (!validator) continue;
			const result = await validator.validate(request, env);
			if (result.valid) {
				if (auth.serviceAccountOnly && result.context?.unkey?.isServiceAccount !== true) continue;
				if (auth.permissions && auth.permissions.length > 0) {
					const userPerms = result.context?.user?.permissions || [];
					if (!auth.permissions.every((p) => userPerms.includes(p))) return {
						valid: false,
						error: "insufficient_permissions",
						message: "Insufficient permissions"
					};
				}
				if (auth.roles && auth.roles.length > 0) {
					const userRoles = result.context?.user?.roles || [];
					if (!auth.roles.some((r) => userRoles.includes(r))) return {
						valid: false,
						error: "insufficient_permissions",
						message: "Insufficient role"
					};
				}
				return result;
			}
		}
		if (auth.requirement === "optional") return {
			valid: true,
			context: {
				authenticated: false,
				method: void 0
			}
		};
		return {
			valid: false,
			error: "invalid_token",
			message: "Authentication required"
		};
	}
	async handle(request, env, ctx) {
		const path$1 = new URL(request.url).pathname;
		const method = request.method;
		const match = this.match(path$1, method);
		if (!match) return null;
		const authResult = await this.authenticate(request, env, match.auth);
		if (!authResult.valid) return this.handleAuthFailure(authResult, match.auth);
		const route = this.routes.find((r) => r.pattern === match.pattern);
		if (!route?.handler) return null;
		return await route.handler(request, env, ctx, authResult.context);
	}
	handleAuthFailure(authResult, auth) {
		if (auth.stealthMode) return new Response("Not Found", { status: 404 });
		if (auth.onFailure) {
			if (auth.onFailure.action === "redirect") {
				const location = auth.onFailure.redirectTo || "/login";
				return Response.redirect(location, 302);
			}
			if (auth.onFailure.action === "page") return new Response(JSON.stringify({
				error: "auth_failed",
				page: auth.onFailure.page,
				context: auth.onFailure.context
			}), {
				status: 401,
				headers: { "Content-Type": "application/json" }
			});
		}
		const status = authResult.error === "insufficient_permissions" ? 403 : 401;
		return new Response(JSON.stringify({
			error: authResult.error,
			message: authResult.message
		}), {
			status,
			headers: { "Content-Type": "application/json" }
		});
	}
};
var DocsManager = class {
	constructor(config = {}) {
		this.cache = /* @__PURE__ */ new Map();
		this.config = {
			cacheEnabled: config.cacheEnabled ?? true,
			handlebarsEnabled: config.handlebarsEnabled ?? true
		};
		this.handlebars = new HandlebarsTemplateEngine();
	}
	register(template$1) {
		const key = template$1.name;
		this.cache.set(key, template$1);
	}
	get(name) {
		return this.cache.get(name) || null;
	}
	has(name) {
		return this.cache.has(name);
	}
	list() {
		return Array.from(this.cache.values()).map((template$1) => ({
			name: template$1.name,
			title: template$1.metadata?.title
		}));
	}
	clearCache() {
		this.cache.clear();
	}
	async render(template$1, options) {
		let content = template$1.content;
		if (this.config.handlebarsEnabled && !options?.skipHandlebars) {
			const variables = options?.variables || {};
			content = await this.handlebars.render(content, variables);
		}
		return {
			content,
			metadata: template$1.metadata
		};
	}
	async renderByName(name, options) {
		const template$1 = this.get(name);
		if (!template$1) throw new Error(`Docs template not found: ${name}`);
		return this.render(template$1, options);
	}
	loadFromMarkdown(markdown, name) {
		const { content, metadata } = this.parseFrontmatter(markdown);
		const template$1 = {
			name,
			content,
			metadata
		};
		if (this.config.cacheEnabled) this.register(template$1);
		return template$1;
	}
	parseFrontmatter(markdown) {
		const match = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
		if (!match) return { content: markdown };
		const [, frontmatterYaml, content] = match;
		try {
			const metadata = {};
			const lines = frontmatterYaml.split("\n");
			for (const line of lines) {
				const colonIndex = line.indexOf(":");
				if (colonIndex === -1) continue;
				const key = line.substring(0, colonIndex).trim();
				metadata[key] = line.substring(colonIndex + 1).trim().replace(/^["']|["']$/g, "");
			}
			return {
				content,
				metadata
			};
		} catch (error) {
			console.warn("Failed to parse frontmatter, using raw markdown:", error);
			return { content: markdown };
		}
	}
	registerHelper(name, fn) {
		this.handlebars.registerHelper(name, fn);
	}
	registerPartial(name, template$1) {
		this.handlebars.registerPartial(name, template$1);
	}
};
var globalManager = null;
function getGlobalDocsManager(config) {
	if (!globalManager) globalManager = new DocsManager(config);
	return globalManager;
}
init_base_agent();
function createConductorHandler(config) {
	return { async fetch(request, env, ctx) {
		return new Response("Conductor initialized - handler implementation coming soon", { headers: { "content-type": "text/plain" } });
	} };
}
var worker_entry_default = {};
export { APIAgent, ApiKeyValidator, BaseAgent, BearerValidator, CookieValidator, CustomValidatorRegistry, DataAgent, DocsManager, DocsMember, Executor, FunctionAgent, GitHubSignatureValidator, MemberLoader, PageAgent, PageRouter, Parser, StateManager, StripeSignatureValidator, ThinkAgent, TwilioSignatureValidator, UnifiedRouter, UnkeyValidator, createApiKeyValidator, createBearerValidator, createConductorHandler, createCookieValidator, createCustomValidatorRegistry, createLoader, createUnkeyValidator, worker_entry_default as default, getGlobalDocsManager };

//# sourceMappingURL=index.js.map