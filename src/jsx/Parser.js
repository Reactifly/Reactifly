const VOID_TAGS = {
    'area': true,
    'base': true,
    'basefont': true,
    'br': true,
    'col': true,
    'frame': true,
    'hr': true,
    'img': true,
    'input': true,
    'link': true,
    'meta': true,
    'param': true,
    'embed': true,
    'command': true,
    'keygen': true,
    'source': true,
    'track': true,
    'wbr': true,
};

const SPECIAL_TAGS = {
    'xmp': true,
    'style': true,
    'script': true,
    'noscript': true,
    'textarea': true,
    'template': true,
    '#comment': true,
};

const HIDDEN_TAGS = {
    'style': true,
    'script': true,
    'noscript': true,
    'template': true,
};

const Parser = function(jsx, f)
{
    if (!(this instanceof Parser))
    {
        return parse(jsx, f)
    }

    this.input = jsx;

    this.getOne = f;
}

Parser.prototype = {
    parse: function()
    {
        return parse(this.input, this.getOne)
    }
}

var rsp = /\s/;

/**
 * 
 * 
 * @param {any} string 
 * @param {any} getOne returns only one node
 * @returns 
 */
function parse(string, getOne)
{
    getOne = (getOne === void 666 || getOne === true);

    var ret = lexer(string, getOne)

    if (getOne)
    {
        return typeof ret[0] === 'string' ? ret[1] : ret[0]
    }

    return ret
}

function lexer(string, getOne)
{
    var tokens = []
    var breakIndex = 120
    var stack = []
    var origString = string
    var origLength = string.length

    stack.last = function()
    {
        return stack[stack.length - 1]
    }
    var ret = []

    function addNode(node)
    {
        var p = stack.last()
        if (p && p.children)
        {
            p.children.push(node)
        }
        else
        {
            ret.push(node)
        }
    }

    var lastNode;

    do {
        if (--breakIndex === 0)
        {
            break
        }
        var arr = getCloseTag(string)

        if (arr)
        {
            //Handle closing tags
            string = string.replace(arr[0], '')
            const node = stack.pop()
            // Handle the following two special cases:
            //1. option will automatically remove element nodes and form their nodeValue into new text nodes
            //2. table will collect tr or text nodes that are not wrapped by thead, tbody, tfoot into a new tbody element
            if (node.type === 'option')
            {
                node.children = [
                {
                    type: '#text',
                    nodeValue: getText(node)
                }]
            }
            else if (node.type === 'table')
            {
                insertTbody(node.children)
            }
            lastNode = null
            if (getOne && ret.length === 1 && !stack.length)
            {
                return [origString.slice(0, origLength - string.length), ret[0]]
            }
            continue
        }

        var arr = getOpenTag(string)
        if (arr)
        {
            string = string.replace(arr[0], '')
            var node = arr[1]
            addNode(node)
            var selfClose = !!(node.isVoidTag || SPECIAL_TAGS[node.type])
            if (!selfClose)
            {
                //Put it here to add children
                stack.push(node)
            }
            if (getOne && selfClose && !stack.length)
            {
                return [origString.slice(0, origLength - string.length), node]
            }
            lastNode = node
            continue
        }

        var text = ''
        do {
            // Handle the situation of <div><<<<<<<div>
            const index = string.indexOf('<')
            if (index === 0)
            {
                text += string.slice(0, 1)
                string = string.slice(1)

            }
            else
            {
                break
            }
        } while (string.length);
        //Handle the situation of <div>{aaa}</div>, <div>xxx{aaa}xxx</div>, <div>xxx</div>{aaa}sss
        const index = string.indexOf('<') //Determine whether there is a label after it
        const bindex = string.indexOf('{') //Determine whether there is jsx behind it
        const aindex = string.indexOf('}')

        let hasJSX = (bindex < aindex) && (index === -1 || bindex < index)
        if (hasJSX)
        {
            if (bindex !== 0)
            { // Collect text nodes before jsx
                text += string.slice(0, bindex)
                string = string.slice(bindex)
            }
            addText(lastNode, text, addNode)
            string = string.slice(1) //remove first "{"
            var arr = parseCode(string)
            addNode(makeJSX(arr[1]))
            lastNode = false
            string = string.slice(arr[0].length + 1) // remove trailing "}"
        }
        else
        {
            if (index === -1)
            {
                text = string
                string = ''
            }
            else
            {
                text += string.slice(0, index)
                string = string.slice(index)
            }
            addText(lastNode, text, addNode)
        }

    } while (string.length);
    return ret
}


function addText(lastNode, text, addNode)
{
    if (/\S/.test(text))
    {
        if (lastNode && lastNode.type === '#text')
        {
            lastNode.text += text
        }
        else
        {
            lastNode = {
                type: '#text',
                nodeValue: text
            }
            addNode(lastNode)
        }
    }
}

//It is used to parse the content in {}, if it encounters an unmatched },
// it will return, and cut the content according to the label
function parseCode(string)
{
    // <div id={ function(){<div/>} }>
    var word = '', //used to match the preceding word
        braceIndex = 1,
        codeIndex = 0,
        nodes = [],
        quote,
        escape = false,
        state = 'code'
    for (var i = 0, n = string.length; i < n; i++)
    {
        var c = string.charAt(i),
            next = string.charAt(i + 1)
        switch (state)
        {
            case 'code':
                if (c === '"' || c === "'")
                {
                    state = 'string'
                    quote = c
                }
                else if (c === '{')
                {
                    braceIndex++
                }
                else if (c === '}')
                {
                    braceIndex--
                    if (braceIndex === 0)
                    {
                        collectJSX(string, codeIndex, i, nodes)
                        return [string.slice(0, i), nodes]
                    }
                }
                else if (c === '<')
                {
                    var word = '',
                        empty = true,
                        index = i - 1
                    do {
                        c = string.charAt(index)
                        if (empty && rsp.test(c))
                        {
                            continue
                        }
                        if (rsp.test(c))
                        {
                            break
                        }
                        empty = false
                        word = c + word
                        if (word.length > 7)
                        { //performance optimization
                            break
                        }
                    } while (--index >= 0);
                    var chunkString = string.slice(i)
                    if (word === '' || /(=>|return|\{|\(|\[|\,)$/.test(word) && /\<\w/.test(chunkString))
                    {
                        collectJSX(string, codeIndex, i, nodes)
                        var chunk = lexer(chunkString, true)
                        nodes.push(chunk[1])
                        i += (chunk[0].length - 1) //Because it already contains <, need to subtract 1
                        codeIndex = i + 1
                    }

                }
                break
            case 'string':
                if (c == '\\' && (next === '"' || next === "'"))
                {
                    escape = !escape
                }
                else if (c === quote && !escape)
                {
                    state = 'code'
                }
                break
        }

    }
}

function collectJSX(string, codeIndex, i, nodes)
{
    var nodeValue = string.slice(codeIndex, i)
    if (/\S/.test(nodeValue))
    { // Put the things in front of { into it
        nodes.push(
        {
            type: '#jsx',
            nodeValue: nodeValue
        })
    }
}

var rtbody = /^(tbody|thead|tfoot)$/

function insertTbody(nodes)
{
    var tbody = false
    for (var i = 0, n = nodes.length; i < n; i++)
    {
        var node = nodes[i]
        if (rtbody.test(node.nodeName))
        {
            tbody = false
            continue
        }

        if (node.nodeName === 'tr')
        {
            if (tbody)
            {
                nodes.splice(i, 1)
                tbody.children.push(node)
                n--
                i--
            }
            else
            {
                tbody = {
                    nodeName: 'tbody',
                    props: {},
                    children: [node]
                }
                nodes.splice(i, 1, tbody)
            }
        }
        else
        {
            if (tbody)
            {
                nodes.splice(i, 1)
                tbody.children.push(node)
                n--
                i--
            }
        }
    }
}


function getCloseTag(string)
{
    if (string.indexOf("</") === 0)
    {
        var match = string.match(/\<\/([\w\.]+)>/);

        if (match)
        {
            var tag = match[1];
            string = string.slice(3 + tag.length)
            return [match[0],
            {
                type: tag
            }]
        }
    }

    return null
}

function getOpenTag(string)
{
    if (string.indexOf("<") === 0)
    {
        var i = string.indexOf('<!--') //Process comment node
        if (i === 0)
        {
            var l = string.indexOf('-->')
            if (l === -1)
            {
                throw ('Comment node is not closed: [' + string.slice(0, 100) + ']');
            }
            var node = {
                type: '#comment',
                nodeValue: string.slice(4, l)
            }

            return [string.slice(0, l + 3), node]
        }
        var match = string.match(/\<(\w[^\s\/\>]*)/) // Process the element node
        if (match)
        {
            var leftContent = match[0],
                tag = match[1]
            var node = {
                type: tag,
                props: {},
                children: []
            }

            string = string.replace(leftContent, '') // Remove the label name (rightContent)

            var arr = getAttrs(string) //processing properties

            if (arr)
            {
                node.props = arr[1]
                string = string.replace(arr[0], '')
                leftContent += arr[0]
            }

            if (string[0] === '>')
            {
                //Handle open tag boundary characters
                leftContent += '>'
                string = string.slice(1)
                if (VOID_TAGS[node.type])
                {
                    node.isVoidTag = true
                }
            }
            else if (string.slice(0, 2) === '/>')
            {
                // Handle the boundary character of the open label
                leftContent += '/>'
                string = string.slice(2)
                node.isVoidTag = true
            }

            if (!node.isVoidTag && SPECIAL_TAGS[tag])
            {
                //If it is script, style, xmp and other elements
                var closeTag = '</' + tag + '>'
                var j = string.indexOf(closeTag)
                var nodeValue = string.slice(0, j)
                leftContent += nodeValue + closeTag
                node.children.push(
                {
                    type: '#text',
                    nodeValue: nodeValue
                })
            }

            return [leftContent, node]
        }
    }
}

function getText(node)
{
    var ret = ''
    node.children.forEach(function(el)
    {
        if (el.type === '#text')
        {
            ret += el.nodeValue
        }
        else if (el.children && !HIDDEN_TAGS[el.type])
        {
            ret += getText(el)
        }
    })
    return ret
}

function getAttrs(string)
{
    var state = 'AttrNameOrJSX',
        attrName = '',
        attrValue = '',
        quote,
        escape,
        props = {}

    for (var i = 0, n = string.length; i < n; i++)
    {
        var c = string[i]
        switch (state)
        {
            case 'AttrNameOrJSX':
                if (c === '/' || c === '>')
                {
                    return [string.slice(0, i), props]
                }
                if (rsp.test(c))
                {
                    if (attrName)
                    {
                        state = 'AttrEqual'
                    }
                }
                else if (c === '=')
                {
                    if (!attrName)
                    {
                        throw 'Property name must be specified.';
                    }

                    state = 'AttrQuoteOrJSX'
                }
                else if (c === '{')
                {
                    state = 'SpreadJSX'
                }
                else
                {
                    attrName += c
                }
                break
            case 'AttrEqual':
                if (c === '=')
                {
                    state = 'AttrQuoteOrJSX'
                }
                break
            case 'AttrQuoteOrJSX':
                if (c === '"' || c === "'")
                {
                    quote = c
                    state = 'AttrValue'
                    escape = false
                }
                else if (c === '{')
                {
                    state = 'JSX'
                }
                break
            case 'AttrValue':
                if (c === '\\')
                {
                    escape = !escape
                }
                if (c !== quote)
                {
                    attrValue += c
                }
                else if (c === quote && !escape)
                {
                    props[attrName] = attrValue
                    attrName = attrValue = ''
                    state = 'AttrNameOrJSX'
                }
                break
            case 'SpreadJSX':
                i += 3
            case 'JSX':

                var arr = parseCode(string.slice(i))
                i += arr[0].length

                props[state === 'SpreadJSX' ? 'spreadAttribute' : attrName] = makeJSX(arr[1])
                attrName = attrValue = ''
                state = 'AttrNameOrJSX'
                break
        }
    }

    throw 'tab must be closed';
}

function makeJSX(JSXNode)
{
    return JSXNode.length === 1 && JSXNode[0].type === '#jsx' ? JSXNode[0] : { type: '#jsx', nodeValue: JSXNode }
}

export default Parser;