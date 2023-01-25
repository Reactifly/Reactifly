import Tokenizer from './Tokenizer';
import { createElement } from '../vdom/element';
import { Fragment } from '../compat/Fragment';
import { sandbox } from './sandbox';
import { CURR_RENDER } from '../internal';
import _ from '../utils/index';

/**
 * Bindings / variable caching.
 *
 * @var  {object}
 */
export const BINDINGS_CACHE = {};

/**
 * Component regex.
 *
 * @var  {object}
 */
const R_COMPONENT = /^(this|[A-Z])/;

/**
 * Cache.
 *
 * @var  {object}
 */
const CACHE_STR = {};

/**
 * Global decencies.
 *
 * @var  {object}
 */
const GLOBAL_BINDINGS = {
    h: createElement,
    Fragment: Fragment
};

/**
 * Reserved words that get removed.
 *
 * @var  {object}
 */
const RESERVED_KEYS = [
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

/**
 * Parse's JSX tokens
 *
 * @param   {string}  jsxStr  JSX  string
 * @returns {object}  config  Options
 */
export default function parse(jsxStr, bindings)
{
    if (_.is_array(jsxStr))
    {
        let args = [Fragment, {}, ...jsxStr];

        return createElement.apply(null, args);
    }

    // Empty
    if (jsxStr === null || typeof jsxStr === 'undefined' || (typeof jsxStr === 'string' && jsxStr.trim() === ''))
    {
        return createElement();
    }

    jsxStr = cleanStr(jsxStr + '');

    // No HTML
    if (!jsxStr.includes('<') && !jsxStr.includes('>'))
    {
        return createElement('text', null, jsxStr);
    }

    let jsx = new Parser(jsxStr);

    let output = jsx.parse();

    return sandbox(output, genBindings(bindings), CURR_RENDER.current);
}

/**
 * Cleans whitespace from string.
 *
 * @param  {string}  input
 * @return {string}
 */
function cleanStr(str)
{
    return str.split(/\n|  /g).filter(block => block !== '').join(' ').trim();
}

/**
 * Generates object of bindings for JSX parsing.
 *
 * @param  {object}  input  bindings
 * @return {object}
 */
function genBindings(bindings)
{
    bindings = !bindings ? { ...GLOBAL_BINDINGS } : { ...bindings, ...GLOBAL_BINDINGS };

    for (let key in BINDINGS_CACHE)
    {
        bindings[key] = BINDINGS_CACHE[key];

        delete BINDINGS_CACHE[key];
    }

    if (CURR_RENDER.current)
    {        
        let props = _.object_props(CURR_RENDER.current);

        _.foreach(props, function(i, k)
        {
            if (!RESERVED_KEYS.includes(k))
            {
                bindings[k] = CURR_RENDER.current[k];
            }
        });
    }

    return bindings;
}

/**
 * Parser. Parses tokenized input into 'createElement' statement. 
 *
 * @param  {string}  str  JSX  string
 */
function Parser(str)
{
    this.input = str;
}

/**
 * Parse current string.
 *
 * @returns {object}
 */
Parser.prototype.parse = function()
{
    let useCache = this.input.length < 720;

    if (useCache && CACHE_STR[this.input])
    {
        return CACHE_STR[this.input];
    }

    var array = (new Tokenizer(this.input)).tokenize();

    var funcString = this.genChildren([array]);

    if (useCache)
    {
        return CACHE_STR[this.input] = funcString;
    }

    return funcString;
}

/**
 * Generates 'createElement' string tag
 *
 * @param   {object}  el  Token element
 * @returns {strng}
 */
Parser.prototype.genTag = function(el)
{
    let children = this.genChildren(el.children, el);
    let props = this.genProps(el.props, el);
    var type = R_COMPONENT.test(el.type) ? el.type : `"${el.type}"`;

    return `h(${type},${props},${children})`;
}

/**
 * Generates props from token
 *
 * @param   {object}  props  Prop values
 * @param   {object}  el     Target token
 * @returns {strng}
 */
Parser.prototype.genProps = function(props, el)
{
    if (!props && !el.spreadAttribute)
    {
        return 'null';
    }

    var ret = '{';

    for (var i in props)
    {
        if (i === 'spreadAttribute') continue;

        ret += JSON.stringify(i) + ':' + this.genPropValue(props[i]) + ',';
    }

    ret = ret.replace(/\,\n$/, '') + '}';

    if (props.spreadAttribute)
    {
        let spread = props.spreadAttribute;

        if (spread.type && spread.type === '#jsx')
        {
            spread = spread.nodeValue;
        }

        return 'Object.assign({},' + spread + ',' + ret + ')';
    }

    return ret;
}

/**
 * Generates props value.
 *
 * @param   {mixed}  val  Prop values
 * @returns {strng}
 */
Parser.prototype.genPropValue = function(val)
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
}


/**
 * Generates children for tag.
 *
 * @param  {array}  Children  Array of child tokens.
 * @param  {strng}  obj       Parant token
 * @param  {string} join      Optional join string
 */
Parser.prototype.genChildren = function(children, obj, join)
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