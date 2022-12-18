import Parser  from './Parser';
import { createElement } from '../vdom/index';

const R_COMPONENT = /^(this|[A-Z])/;
const CACHE_FNS   = {};
const CACHE_STR   = {};
const __scope     = {};

window.__scope    = __scope;

__scope.createElement = createElement;

export default function evaluate(str, obj, config)
{
    var jsx = new innerClass(str, config);

    var output = jsx.init();
    
    if (!obj)
    {
        obj = {};
    }
    
    if (typeof __scope === 'function')
    {
        obj.__scope = __scope;
    }
    
    var args = 'var args0 = arguments[0];'
    
    for (var i in obj)
    {
        if (i !== 'this')
        {
            args += 'var ' + i + ' = args0["' + i + '"];';
        }
    }

    args += 'return ' + output;
    try
    {
        var fn
        if (CACHE_FNS[args])
        {
            fn = CACHE_FNS[args]
        }
        else
        {
            fn = CACHE_FNS[args] = Function(args)
        }
        
        var a = fn.call(obj.this, obj)
        
        return a;
    }
    catch (e)
    {
        console.log(fn);
        console.log(CACHE_FNS);
        console.log(e)
    }
}

function innerClass(str, config)
{
    config      = config || {};
    config.ns   = '__scope';
    this.input  = str;
    this.ns     = config.ns
    this.type   = config.type
}

innerClass.prototype =
{
    init: function()
    {
        if (typeof Parser === 'function')
        {
            var useCache = this.input.length < 720
            if (useCache && CACHE_STR[this.input])
            {
                return CACHE_STR[this.input]
            }
            var array = (new Parser(this.input)).parse();

            var evalString = this.genChildren([array])
            if (useCache)
            {
                return CACHE_STR[this.input] = evalString
            }
            return evalString
        }
        else
        {
            throw 'need Parser https://github.com/RubyLouvre/jsx-parser'
        }
    },
    genTag: function(el)
    {
        var children = this.genChildren(el.children, el);
        var ns       = this.ns;
        var type     = R_COMPONENT.test(el.type) ? el.type : JSON.stringify(el.type);
        
        return ns + '.createElement(' + type +
            ',' + this.genProps(el.props, el) +
            ',' + children + ')'
    },
    genProps: function(props, el)
    {
        if (!props && !el.spreadAttribute)
        {
            return 'null';
        }

        var ret = '{';

        for (var i in props)
        {
            ret += JSON.stringify(i) + ':' + this.genPropValue(props[i]) + ',\n';
        }

        ret = ret.replace(/\,\n$/, '') + '}';
        
        if (el.spreadAttribute)
        {
            return 'Object.assign({},' + el.spreadAttribute + ',' + ret + ')';
        }

        return ret;
    },
    genPropValue: function(val)
    {
        if (typeof val === 'string')
        {
            return JSON.stringify(val)
        }
        if (val)
        {
            if (Array.isArray(val.nodeValue))
            {
                return this.genChildren(val.nodeValue)
            }
            if (val)
            {
                return val.nodeValue
            }
        }
    },
    genChildren: function(children, obj, join)
    {
        if (obj)
        {

            if (obj.isVoidTag || !obj.children.length)
            {
                return 'null'
            }
        }

        var ret = [];
        
        for (var i = 0, el; el = children[i++];)
        {
            if (el.type === '#jsx')
            {
                if (Array.isArray(el.nodeValue))
                {
                    ret[ret.length] = this.genChildren(el.nodeValue, null, ' ')
                }
                else
                {
                    ret[ret.length] = el.nodeValue
                }
            }
            else if (el.type === '#text')
            {
                ret[ret.length] = JSON.stringify(el.nodeValue)
            }
            else if (el)
            {
                ret[ret.length] = this.genTag(el)
            }
        }

        return ret.join(join || ',')
    }
};
