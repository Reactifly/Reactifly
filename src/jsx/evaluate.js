import Parser from './Parser';
import { createElement } from '../vdom/element';
import { Fragment } from '../compat/Fragment';
import { RENDER_QUEUE } from '../internal';
import { sandbox } from './sandbox';
import _ from '../utils/index';

const R_COMPONENT = /^(this|[A-Z])/;
const CACHE_FNS = {};
const CACHE_STR = {};
export const COMPONENT_CACHE = {};

const GLOBAL_CONTEXT = 
{
    h : createElement,
    Fragment  : Fragment
};

const RESERVED_KEYS =
[
    'render',
    'children',
    '__internals',
    'reactifly',
    'Fragment',
    'this',
    'jsx',
    'state',
    'defaultProps',
    'forceUpdate',
    'getState',
    'setState',
    'componentDidCatch',
    'componentDidMount',
    'componentDidUpdate',
    'componentWillUnmount',
    'getSnapshotBeforeUpdate',
    'getDerivedStateFromProps',
    'componentWillReceiveProps',
    'shouldComponentUpdate',
    'componentWillUpdate',
    'context',
];

function genDepencies(depencies)
{
    depencies = !depencies ? {...GLOBAL_CONTEXT} : { ...depencies, ...GLOBAL_CONTEXT };

    for (let key in COMPONENT_CACHE)
    {
        depencies[key] = COMPONENT_CACHE[key];
    }

    let component = RENDER_QUEUE.current;

    let props = _.object_props(component);

    _.foreach(props, function(i, k)
    {
        if (!RESERVED_KEYS.includes(k))
        {
            depencies[k] = component[k];
        }
    });

    return depencies;
}

export default function evaluate(str, depencies)
{
    if (str === null || typeof str === 'undefined' || (typeof str === 'string' && str.trim() === ''))
    {
        return createElement();
    }

    str = str + '';

    let jsx = new innerClass(str);

    let output = jsx.init();

    depencies = genDepencies(depencies);

    return sandbox(output, depencies, RENDER_QUEUE.current);
}


function innerClass(str, config)
{
    config = config || {};
    this.input = str;
    this.type = config.type
}

innerClass.prototype = {
    init: function()
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
        
    },
    genTag: function(el)
    {
        let children = this.genChildren(el.children, el);
        let props    = this.genProps(el.props, el);
        var type = R_COMPONENT.test(el.type) ? el.type : JSON.stringify(el.type);

        return `h(${type},${props},${children})`;
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
            ret += JSON.stringify(i) + ':' + this.genPropValue(props[i]) + ',';
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
                return 'null';
            }
        }

        var ret = [];

        for (var i = 0, el; el = children[i++];)
        {
            if (el.type === '#jsx')
            {                
                if (Array.isArray(el.nodeValue))
                {
                    ret[ret.length] = this.genChildren(el.nodeValue, null, ' ');
                }
                else
                {
                    ret[ret.length] = el.nodeValue;
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

        return ret.join(join || ',');
    }
};