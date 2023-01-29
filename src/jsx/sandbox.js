import { DEBUG } from '../internal';

// Assume a browser environment.
var reservedWords = [
    "break", "do", "in", "typeof",
    "case", "else", "instanceof", "var",
    "catch", "export", "new", "void",
    "class", "extends", "return", "while",
    "const", "finally", "super", "with",
    "continue", "for", "switch", "yield",
    "debugger", "function", "this",
    "delete", "import", "try",
    "enum", "implements", "package", "protected", "static",
    "interface", "private", "public",
    'eval'
];
var identifier = /^[$_a-zA-Z][$_a-zA-Z0-9]*$/;
var acceptableVariable = function acceptableVariable(v)
{
    return (builtinsStr.indexOf(v) === -1) && (reservedWords.indexOf(v) === -1) && (identifier.test(v));
};

// Produce the code to shadow all globals in the environment
// through lexical binding.
// See also var `builtins`.
var builtinsStr = ['JSON', 'Object', 'Function', 'Array', 'String', 'Boolean', 'Number', 'Date', 'RegExp', 'Error', 'EvalError', 'RangeError', 'ReferenceError', 'SyntaxError', 'TypeError', 'URIError'];

var resetEnv = function()
{
    var reset = 'var ';
    if (Object.getOwnPropertyNames)
    {
        var obj = window || global;
        var globals;
        while (obj != null)
        {
            globals = Object.getOwnPropertyNames(obj);
            for (var i = 0; i < globals.length; i++)
            {
                if (acceptableVariable(globals[i]))
                {
                    reset += globals[i] + ',';
                }
            }
            obj = Object.getPrototypeOf(obj);
        }
    }
    else
    {
        for (var sym in global)
        {
            if (acceptableVariable(sym))
            {
                reset += sym + ',';
            }
        }
    }

    reset += 'undefined;';

    return reset;
}

// Given a constructor function, do a deep copy of its prototype
// and return the copy.
var dupProto = function(constructor)
{
    if (!constructor.prototype) return;
    var fakeProto = Object.create(null);

    var pnames = Object.getOwnPropertyNames(constructor.prototype);

    for (var i = 0; i < pnames.length; i++)
    {
        if (pnames[i] !== 'arguments' && pnames[i] !== 'caller')
        {
            fakeProto[pnames[i]] = constructor.prototype[pnames[i]];
        }
    }

    return fakeProto;
};

var redirectProto = function(constructor, proto)
{
    if (!constructor.prototype) return;
    var pnames = Object.getOwnPropertyNames(proto);
    for (var i = 0; i < pnames.length; i++)
    {
        try
        {
            constructor.prototype[pnames[i]] = proto[pnames[i]];
        }
        catch (e) {}
    }
};

var dupProperties = function(obj)
{
    var fakeObj = Object.create(null);
    var pnames = Object.getOwnPropertyNames(obj);
    for (var i = 0; i < pnames.length; i++)
    {
        fakeObj[pnames[i]] = obj[pnames[i]];
        // We cannot deal with cyclic data and reference graphs,
        // so we discard them.
        if (typeof obj[pnames[i]] === 'object')
        {
            try
            {
                delete obj[pnames[i]];
            }
            catch (e) {}
        }
    }
    return fakeObj;
};

var resetProperties = function(obj, fakeObj)
{
    var pnames = Object.getOwnPropertyNames(fakeObj);
    for (var i = 0; i < pnames.length; i++)
    {
        try
        {
            obj[pnames[i]] = fakeObj[pnames[i]];
        }
        catch (e) {}
    }
};

var removeAddedProperties = function(obj, fakeObj)
{
    if (!fakeObj) return;
    var pnames = Object.getOwnPropertyNames(obj);
    for (var i = 0; i < pnames.length; i++)
    {
        if (fakeObj[pnames[i]] === undefined)
        {
            try
            {
                delete obj[pnames[i]];
            }
            catch (e) {}
        }
    }
};

// Keep in store all real builtin prototypes to restore them after
// a possible alteration during the evaluation.
var builtins = [JSON, Object, Function, Array, String, Boolean, Number, Date, RegExp, Error, EvalError, RangeError, ReferenceError, SyntaxError, TypeError, URIError];
var realProtos = new Array(builtins.length);
var realProperties = new Array(builtins.length);

// Fake all builtins' prototypes.
var alienate = function()
{
    for (var i = 0; i < builtins.length; i++)
    {
        realProtos[i] = dupProto(builtins[i]);
        redirectProto(builtins[i], dupProto(builtins[i]));
        realProperties[i] = dupProperties(builtins[i]);
    }
};

// Restore all builtins' prototypes.
var unalienate = function()
{
    for (var i = 0; i < builtins.length; i++)
    {
        removeAddedProperties(builtins[i].prototype, realProtos[i]);
        redirectProto(builtins[i], realProtos[i]);
        removeAddedProperties(builtins[i], realProperties[i]);
        resetProperties(builtins[i], realProperties[i]);
    }
};

const SANDBOX_NAME = '$sandbox$';

const DISSALOWEDES = {
    // disallowed
    global: undefined,
    process: undefined,
    module: undefined,
    require: undefined,
    document: undefined,
    window: undefined,
    Window: undefined,
    // no evil...
    eval: undefined,
    Function: undefined
};


// Evaluate code as a String (`source`) without letting global variables get
// used or modified. The `sandbox` is an object containing variables we want
// to pass in.
export function sandbox(source, sandbox, _this)
{    
    _this = _this || null;

    sandbox = sandbox || Object.create(null);

    for (let i = 0; i < builtinsStr.length; ++i)
    {
        let key = builtinsStr[i];

        sandbox[key] = builtins[i];
    }

    sandbox = { ...sandbox, ...DISSALOWEDES };

    let sandboxed = 'this.constructor.constructor = function () {};\nvar ';

    for (var field in sandbox)
    {
        sandboxed += `${field} = ${SANDBOX_NAME}['${field}'],\n`;
    }

    sandboxed += `undefined;\n${resetEnv()}\n return ${source};`;

    alienate();

    let ret;

    try
    {
        ret = Function(SANDBOX_NAME, sandboxed).call(_this, sandbox);
    }
    catch (e)
    {
        if (DEBUG)
        {
            console.log(e);
        }
    }

    unalienate();

    return ret;
}