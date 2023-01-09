import Tokenizer from './Tokenizer';
import { createElement } from '../vdom/element';
import { Fragment } from '../compat/Fragment';
import { RENDER_QUEUE } from '../internal';
import { sandbox } from './sandbox';
import _ from '../utils/index';

export const COMPONENT_CACHE = {};

const R_COMPONENT = /^(this|[A-Z])/;

const CACHE_STR = {};

const GLOBAL_DEPENCIES = 
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

/**
 * Parse's JSX tokens
 *
 * @param  {string}  str     JSX  string
 * @return {object}  config  Options
 *
 */
export default function parse(str, depencies)
{
    if (str === null || typeof str === 'undefined' || (typeof str === 'string' && str.trim() === ''))
    {
        return createElement();
    }

    str = cleanStr(str + '');

    let jsx = new Parser(str);

    let output = jsx.parse();

    depencies = genDepencies(depencies);

    return sandbox(output, depencies, RENDER_QUEUE.current);
}

/**
 * Cleans whitespace from string.
 *
 * @param  {string}  input
 * @return {string}
 */
function cleanStr(str)
{
    return str.split(/\n|  /g).filter(block => block !== '').join(' ');
}

/**
 * Generates object of depencies for JSX parsing.
 *
 * @param  {object}  input  depencies
 * @return {object}
 */
function genDepencies(depencies)
{
    depencies = !depencies ? {...GLOBAL_DEPENCIES} : { ...depencies, ...GLOBAL_DEPENCIES };

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

/**
 * Parser. Parses tokenized input into 'createElement' statement. 
 *
 * @param  {string}  str     JSX  string
 * @return {object}  config  Options
 */
function Parser(str, config)
{
    config = config || {};
    
    this.input = str;
    
    this.type = config.type
}

/**
 * Parse current string.
 *
 * @returns {object}
 */
Parser.prototype.parse = function()
{
    var useCache = this.input.length < 720;

    if (useCache && CACHE_STR[this.input])
    {            
        return CACHE_STR[this.input];
    }

    var array = (new Tokenizer(this.input)).parse();

    var evalString = this.genChildren([array]);

    if (useCache)
    {
        return CACHE_STR[this.input] = evalString;
    }

    return evalString;
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
    let props    = this.genProps(el.props, el);
    var type     = R_COMPONENT.test(el.type) ? el.type : JSON.stringify(el.type);

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
