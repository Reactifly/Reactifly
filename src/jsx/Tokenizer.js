const Symbols = new Proxy(
{},
{
    get: (_, k) => Symbol(k)
})

// Token types, 
//  These should be symbols of some kind, 
//  just represented by strings for now.

// I do like the idea of lexing data / rcdata etc as well
// and emitting separate newline tokens there

const Tokens = {
    attributeAssign: 'attributeAssign',
    attributeName: 'attributeName',
    attributeValueData: 'attributeValueData',
    attributeValueJsx: 'attributeValueJsx',
    attributeValueEnd: 'attributeValueEnd',
    attributeValueStart: 'attributeValueStart',
    attributeJsxSpread: 'attributeJsxSpread',
    bogusCharRef: 'bogusCharRef',
    charRefDecimal: 'charRefDecimal',
    charRefHex: 'charRefHex',
    charRefLegacy: 'charRefLegacy',
    charRefNamed: 'charRefNamed',
    commentData: 'commentData',
    commentEnd: 'commentEnd',
    commentEndBogus: 'commentEndBogus',
    commentStart: 'commentStart',
    commentStartBogus: 'commentStartBogus',
    data: 'data',
    endTagPrefix: 'endTagPrefix',
    endTagStart: 'endTagStart',
    lessThanSign: 'lessThanSign',
    plaintext: 'plaintext',
    rawtext: 'rawtext',
    rcdata: 'rcdata',
    tagSpace: 'space',
    startTagStart: 'startTagStart',
    tagEnd: 'tagEnd',
    tagEndAutoclose: 'tagEndAutoclose',
    tagName: 'tagName',

    // JSX
    jsxStart: 'jsxStart',
    jsxEnd: 'jsxEnd',
    jsxBody: 'jsxBody',
}

const T = Tokens;

// HTML5 Lexer
// ===========

// State machine state names

const
{
    tagName,
    attributeName,
    attributeValueData,
    attributeValueJsx,
    attributeJsxSpread,

    data,
    rcdata,
    rawtext,
    plaintext,

    charRefNamed,
    charRefDecimal,
    charRefHex,

    afterAttributeName,
    afterAttributeValueQuoted,
    beforeAttributeName,
    beforeAttributeValue,
    bogusComment,
    comment,
    commentEnd,
    commentEndBang,
    commentEndDash,
    commentStart,
    commentStartDash,
    content,
    charRef,
    endTagOpen,
    endTagOpenIn_,
    hexDigits,
    markupDeclarationOpen,
    markupDeclarationOpenDash,
    numericCharRef,
    selfClosingStartTag,
    lessThanSignIn_,
    tagOpen,

    jsxOpen,
    jsxBody,
    jsxClose,

} = Symbols

// Tag types, used in Lexer state

const
{
    startTag,
    endTag
} = Symbols

// Character classes

const
    ALPHA = /[A-Za-z]/,
    ALPHANUM = /[A-Za-z0-9]/,
    DIGITS = /[0-9]/,
    HEXDIGITS = /[0-9a-fA-F]/,
    SPACE = /[\t\r\n\f ]/,
    TAGEND = /[\t\r\n\f />]/

// The content map specifies the names of 
// rawtext, rcdata and plaintext elements.
// Script elements will use scriptdata in a future version. 
// NB. if scripting is enabled in the user agent, then 
// noscript tags are rawtext elements, but defaulting to
// data appears to be more appropriate to me. 

const content_map = {
    style: rawtext,
    script: rawtext,
    xmp: rawtext,
    iframe: rawtext,
    noembed: rawtext,
    noframes: rawtext,
    textarea: rcdata,
    title: rcdata,
    plaintext: plaintext,
}

// The token_map specifies the token type based on the current state
// This is used by `end` to determine the type of the remaining chunk. 

const token_map = {
    [attributeValueData]: T.attributeValueData,
    [attributeValueJsx]: T.attributeValueJsx,
    [attributeName]: T.attributeName,
    [afterAttributeName]: T.tagSpace,
    [afterAttributeValueQuoted]: null,
    [beforeAttributeName]: T.tagSpace,
    [beforeAttributeValue]: T.attributeAssign,
    [bogusComment]: T.commentData,
    [comment]: T.commentData,
    [commentEnd]: T.commentData,
    [commentEndBang]: T.commentData,
    [commentEndDash]: T.commentData,
    [commentStart]: null,
    [commentStartDash]: T.commentData,
    [content]: null,
    [charRef]: T.bogusCharRef,
    [data]: T.data,
    [charRefDecimal]: T.charRefDecimal, // unterminated,
    [endTagOpen]: T.endTagStart, // TODO, error?,
    [endTagOpenIn_]: T.endTagPrefix,
    [hexDigits]: T.charRefHex, // unterminated,
    [charRefHex]: T.charRefHex, // unterminated,
    [markupDeclarationOpen]: T.commentStartBogus,
    [markupDeclarationOpenDash]: T.commentStartBogus,
    [charRefNamed]: T.charRefNamed,
    [numericCharRef]: T.bogusCharRef,
    [selfClosingStartTag]: T.tagSpace, // Actually, a slash-space,
    [plaintext]: T.plaintext,
    [rawtext]: T.rawtext,
    [rcdata]: T.rcdata,
    [lessThanSignIn_]: T.endTagPrefix,
    [tagName]: T.tagName,
    [tagOpen]: T.lessThanSign,
}

// And finally, the Lexer class

class Lexer
{

    constructor(delegate, trimTokens)
    {
        this.delegate = delegate;
        this.trimTokens = trimTokens;
        this.init()
    }

    init()
    {
        this.state = data /* state name */
        this.returnState = data /* return state used by charRef(In_) and endTagOpenIn_ states */
        this.tagName = '#document' /* last seen open tag */
        this.tagType = null
        this.quotation = null /* attribute value quotation style, can be '', '"' or "'" */
        this.prefixCount = 0 /* used in rawtext and rcdata to compare tentative endTags to tagName */
        this.position = {
            line: 1,
            column: 0
        } /* over-all line/ column position */
        this._remains = '' /* possible leftovers from previous write call */
        this.braceDepth = 0;
        this.prevEmit = null;
        this.jsxDepth = 0;
        this.jsxInQuote = false;
        this.stack = [];
        this.jsxState;
    }

    write(chunk)
    {
        let start = 0,
            p = 0

        if (this.trimTokens)
        {
            chunk = chunk.split(/\n|  /g).filter(block => block !== '').join(' ').trim();
        }

        if (this._remains)
        {
            chunk = this._remains + chunk
            p = this._remains.length
            this._remains = null
        }

        // Right, eeh. so resetting emit here in order to
        //  keep p private in an unverified assumption that it is faster. 

        this.emit = function(type, ...rest)
        {
            this._emit(type, chunk.substring(start, p), ...rest)

            start = p
        }

        this.next = function()
        {
            chunk.substring(start, p)
            start = p
        }

        this.chunk = function()
        {
            return chunk.substring(start, p);
        }

        this.emitInclusive = function(type, ...rest)
        {
            this._emit(type, chunk.substring(start, p + 1), ...rest)
            start = p + 1
        }

        this.emitN = function(type, count)
        {
            count = typeof count === 'undefined' ? 1 : count;

            let end = start + 1 + count;

            this._emit(type, chunk.substring(start, end))

            start = end;
        }

        const l = chunk.length
        while (p < l)
        {
            const char = chunk[p]

            // Count global line/ column position
            // TODO treat CR, LF, CRLF as a single LF. (Also in output ?? Noo..)
            // Furthermore, output them as a separate tokens, please. 

            if (char === '\r' || char === '\n')
            {
                this.position.line++
                this.position.column = 0
            }

            let r = this[this.state](char)
            if (r !== false)
            {
                p++
                this.position.column++
            }
        }
        if (start < l)
            this._remains = chunk.substring(start)
    }

    end(chunk = null)
    {
        if (chunk) this.write(chunk)
        // And emit the rest as specified in token_map
        let type = token_map[this.state]
        if (type) this._emit(type, this._remains,
        {})
        this.delegate.end()
        this.init() /* re-init for reuse */
    }

    _emit(type, data, ...mods)
    {
        if (this.trimTokens && typeof data === 'string')
        {
            data = data.trim();
        }

        if (data === '') return;

        this.prevEmit = type;

        if (type === T.charRefNamed)
        {
            for (let token of splitCharRef(data, mods[0].inAttribute, mods.nextChar))
                this.delegate.write(token)
        }
        else
            this.delegate.write([type, data, ...mods])
    }

    // All methods that follow implement specific named lexer states. 

    // The `content` state doesn't occur in the html5 spec. It functions as
    // an intermediate state for implementing support for rawtext / rcdata
    // elements without requiring a full parser phase. It does not consume. 

    // These methods are assumed to 'consume' their input character by default,
    //  however, they may choose to signal that they did not by returning false. 

    [content](char)
    {
        this.state = this.tagType === startTag && this.tagName in content_map ?
            content_map[this.tagName] : data
        return false
    }

    [data](char)
    {
        // JSX Func was left open
        if (this.jsxDepth > 0 && (char !== '>' && char !== '<'))
        {
            this.state = jsxBody;

            return false;
        }
        else if (char === '{')
        {
            this.state = jsxBody;

            return false;
        }
        else if (char === '}')
        {
            this.state = jsxBody;

            return false;
        }
        else if (char === '<')
        {
            this.emit(T.data)

            this.state = tagOpen
        }
        else if (char === '&')
        {
            this.emit(T.data)
            this.returnState = data
            this.state = charRef
        }

        // TODO tokenize newlines separately
    }

    // reached after a `<` symbol in html-data. 
    [jsxBody](char)
    { 
        let jsx = this.chunk().trim();

        if (char === '"' || char === '\'' || char === '`')
        {
            if (jsx.slice(-1) !== '\\')
            {
                this.jsxInQuote = this.jsxInQuote === true ? false : true;
            }
        }
        else if (!this.jsxInQuote)
        {
            if (char === '(')
            {
                this.jsxDepth++;
            }
            else if (char === ')')
            {
                this.jsxDepth--;
            }
            else if (char === '{')
            {
                this.jsxDepth++;

                if (this.jsxDepth === 1)
                {
                    this.jsxState = 'open';
                }
            }
            else if (char === '}')
            {
                this.jsxDepth--;

                if (this.jsxDepth === 0)
                {
                    if (this.jsxState === 'open')
                    {
                        this.emitInclusive('jsx');

                        this.jsxState = null;
                    }
                    else
                    {
                        this.emitInclusive('jsxFuncClose');
                    }
                    
                    this.state = data;
                }
            }
            else if (char === '<')
            {
                this.jsxState = null;

                if (this.jsxDepth > 0)
                {
                    if (jsx[0] === ')' || jsx[0] === '}')
                    {                        
                        this.emit('jsxFuncClose');
                    }
                    else
                    {
                        this.emit('jsxFuncOpen');
                    }

                    this.state = tagOpen
                }
            }
        }
    }

    // reached after a `<` symbol in html-data. 
    [tagOpen](char)
    {
        if (char === '!')
        {
            this.state = markupDeclarationOpen
        }
        else if (char === '/')
        {
            this.state = endTagOpen
        }
        else if (ALPHA.test(char))
        {
            this.emit(T.startTagStart)
            this.state = tagName
            this.tagType = startTag
            this.tagName = char.toLowerCase()
        }
        else if (char === '?')
        {
            this.emitInclusive(T.commentStartBogus,
            {
                error: 'invalid tag opening \'<?\''
            })

            this.state = bogusComment;
        }
        else
        {
            this.emit(T.lessThanSign,
            {
                error: 'unescaped less-than sign'
            })
            if (char === '<')
            {}
            else if (char === '&')
            {
                this.returnState = data
                this.state = charRef
            }
            else
            {
                this.state = data
            }
        }
    }

    // The `tagName` state is reached after an alphabetic character
    // that trails `<` or `</`. We stay in this state until
    // whitespace, `/` or `>` is encountered. 
    [tagName](char)
    {
        if (SPACE.test(char))
        {
            this.emit(T.tagName)
            this.state = beforeAttributeName
        }
        else if (char === '/')
        {
            this.emit(T.tagName)
            this.state = selfClosingStartTag
        }
        else if (char === '>')
        {
            this.emit(T.tagName)
            this.emitInclusive(T.tagEnd)
            this.state = content
        }
        else
        {
            this.p++
            // The following is a bit of a hack, used in `content`,
            // for supporting rcdata and rawtext elements
            if (this.tagType === startTag)
                this.tagName = this.tagName + char.toLowerCase()
        }
    }

    // reached after the `/` symbol within tags
    [selfClosingStartTag](char)
    {
        if (char === '>')
        {
            this.emitInclusive(T.tagEndAutoclose)
            this.state = data
        }
        else if (SPACE.test(char) || char === '/')
        {}
        else
        {
            this.emit(T.tagSpace)
            this.state = attributeName
        }
    }

    // reached after `</`
    [endTagOpen](char)
    {
        if (ALPHA.test(char))
        {
            this.emit(T.endTagStart)
            this.state = tagName
            this.tagType = endTag
            this.tagName = ''
        }
        else if (char === '>')
        {
            this.emit(T.commentStartBogus,
            {
                error: 'invalid comment'
            })
            this.emitInclusive(T.commentEndBogus)
            this.state = data
        }
        else
        {
            this.emit(T.commentStartBogus,
            {
                error: 'invalid comment (may be a malformed end tag)'
            })
            this.state = bogusComment
        }
    }

    // Attribute names may start with anything except space, `/`, `>`
    // subsequent characters may be anything except space, `/`, `=`, `>`.  
    // e.g. ATTRNAME = `/^[^\t\n\f />][^\t\n\f /=>]*$/`
    [beforeAttributeName](char)
    {
        if (SPACE.test(char))
        {}
        else if (char === '/')
        {
            this.emit(T.tagSpace)
            this.state = selfClosingStartTag
        }
        else if (char === '>')
        {
            this.emit(T.tagSpace)
            this.emitInclusive(T.tagEnd)
            this.state = content
        }
        else if (char === '{')
        {
            this.state = attributeJsxSpread
            this.braceDepth = 1;
        }
        else
        {
            this.emit(T.tagSpace)
            this.state = attributeName
        }
    }

    [attributeJsxSpread](char)
    {
        if (char === '{')
        {
            this.braceDepth++;
        }
        else if (char === '}')
        {
            this.braceDepth--;
        }

        if (char === '}' && this.braceDepth === 0)
        {
            this.emitInclusive(T.attributeJsxSpread)
            this.state = afterAttributeValueQuoted
        }
    }

    [attributeName](char)
    {
        if (SPACE.test(char))
        {
            this.emit(T.attributeName)
            this.state = afterAttributeName
        }
        else if (char === '/')
        {
            this.emit(T.attributeName) // Stand alone attribute
            this.state = selfClosingStartTag
        }
        else if (char === "=")
        { // attribute with value
            this.emit(T.attributeName)
            this.state = beforeAttributeValue
        }
        else if (char === '>')
        {
            this.emit(T.attributeName) // Stand alone attribute
            this.emitInclusive(T.tagEnd)
            this.state = content
        }
        else
        {}
    }

    [afterAttributeName](char)
    {
        if (SPACE.test(char))
        {}
        else if (char === '/')
        {
            this.emit(T.tagSpace) /* was a standalone attribute */
            this.state = selfClosingStartTag
        }
        else if (char === "=")
        { // attribute with value
            this.state = beforeAttributeValue
        }
        else if (char === '>')
        {
            this.emit(T.tagSpace) /* was a standalone attribute */
            this.emitInclusive(T.tagEnd)
            this.state = content
        }
        else
        {
            this.emit(T.tagSpace) /* was a standalone attribute */
            this.state = attributeName
        }
    }

    // reached after the `=` sign after an attribute name 
    // NB trailing space is (at the moment) seen as part of the equals token
    [beforeAttributeValue](char)
    {
        if (SPACE.test(char)){}
        else if (char === '{')
        {
            this.emit(T.attributeAssign)
            this.state = attributeValueData
            this.quotation = '}'
            this.emitInclusive(T.attributeValueStart)
            this.braceDepth = 1;
        }
        else if (char === '"' || char === "'")
        {
            this.emit(T.attributeAssign)
            this.state = attributeValueData
            this.quotation = char
            this.emitInclusive(T.attributeValueStart)
        }
        else if (char === '>')
        {
            this.emit(T.attributeAssign)
            this.emit(T.attributeValueStart)
            this.emit(T.attributeValueData,
            {
                error: 'missing attribute value'
            })
            this.emit(T.attributeValueEnd)
            this.emitInclusive(T.tagEnd)
            this.state = content
        }
        else if (char === '&')
        {
            this.emit(T.attributeAssign)
            this.emit(T.attributeValueStart)
            this.quotation = ''
            this.returnState = attributeValueData
            this.state = charRef
        }
        else
        {
            this.emit(T.attributeAssign)
            this.emit(T.attributeValueStart)
            this.state = attributeValueData
            this.quotation = ''
            if (char === '<' || char === '=' || char === '`')
                this.emit(T.attributeValueData,
                {
                    error: 'attribute values must not start with a (' + char + ') character'
                })
        }
    }

    [attributeValueData](char)
    {
        if (char === '{' && this.quotation === '}')
        {
            this.braceDepth++;
        }
        else if (char === '}' && this.quotation === '}')
        {
            this.braceDepth--;
        }

        if (char === '&')
        {
            this.emit(T.attributeValueData)
            this.returnState = attributeValueData
            this.state = charRef
        }
        else if (char === this.quotation && this.braceDepth === 0)
        {
            if (this.quotation === '}')
            {
                this.emit(T.attributeValueJsx)
                this.emitInclusive(T.attributeValueEnd)
                this.state = afterAttributeValueQuoted
            }
            else
            {
                this.emit(T.attributeValueData)
                this.emitInclusive(T.attributeValueEnd)
                this.state = afterAttributeValueQuoted
            }

        }
        else if (this.quotation === '' && SPACE.test(char))
        {
            this.emit(T.attributeValueData)
            this.emit(T.attributeValueEnd)
            this.state = beforeAttributeName
        }
        else if (this.quotation === '' && char === '>')
        {
            this.emit(T.attributeValueData)
            this.emit(T.attributeValueEnd)
            this.emitInclusive(T.tagEnd)
            this.state = content
        }
        else
        {}
    }

    [afterAttributeValueQuoted](char)
    {
        if (SPACE.test(char))
        {
            this.state = beforeAttributeName
        }
        else if (char === '/')
        {
            this.state = selfClosingStartTag
        }
        else if (char === '>')
        {
            this.emitInclusive(T.tagEnd)
            this.state = content
        }
        else
        {
            this.emit(T.tagSpace,
            {
                error: 'missing space after attribute'
            })
            this.state = attributeName
        }
    }

    // ### Markup declaration

    // reached after `<!`
    [markupDeclarationOpen](char)
    {
        if (char === '-')
        {
            // The spec uses a one character lookahead here,
            // I use an additional state 'markupDeclarationOpenDash' instead
            this.state = markupDeclarationOpenDash
        }
        // TWO cases are omitted here: doctype tags and cdata sections
        //  those will be tokenized as bogus comments instead. 
        else if (char === '>')
        {
            this.emit(T.commentStartBogus,
            {
                error: 'invalid comment'
            })
            this.emitInclusive(T.commentEndBogus)
            this.state = data
        }
        else
        {
            this.emit(T.commentStartBogus,
            {
                error: 'invalid comment (may be an unhandled markup declaration)'
            })
            this.state = bogusComment
        }
    }

    // reached after `<!-`
    [markupDeclarationOpenDash](char)
    {
        if (char === '-')
        {
            this.emitInclusive(T.commentStart)
            this.state = commentStart
        }
        else
        {
            this.emit(T.commentStartBogus,
            {
                error: 'invalid comment (comments should start with <!--)'
            })
            this.state = bogusComment
        }
    }

    // ### Comments

    // reached after `<!--`
    [commentStart](char)
    {
        if (char === '-')
        {
            this.state = commentStartDash
        }
        else if (char === '>')
        {
            this.emitInclusive(T.commentEnd)
            this.state = data
        }
        else
        {
            this.state = comment
        }
    }

    // reached after `<!---`
    [commentStartDash](char)
    {
        if (char === '-')
        {
            this.state = commentEnd
        }
        else if (char === '>')
        {
            this.emitInclusive(T.commentEnd)
            this.state = data
        }
        else
        {
            this.state = comment
        }
    }

    [comment](char)
    {
        if (char === '-')
        {
            this.emit(T.commentData)
            this.state = commentEndDash
        }
        else
        {}
    }

    // reached after `-` in a comment
    [commentEndDash](char)
    {
        if (char === '-')
        {
            this.state = commentEnd
        }
        else
        {
            this.state = comment
        }
    }

    // reached after `--` in a comment
    [commentEnd](char)
    {
        if (char === '>')
        {
            this.emitInclusive(T.commentEnd)
            this.state = data
        }
        else if (char === "!")
        {
            // This is a parse error, will be reported in the next state
            this.state = commentEndBang
        }
        else
        {
            this.emit(T.commentData,
            {
                error: 'comment data should not contain --'
            })
            this.state = comment
        }
    }

    // reached after `--!` in a comment
    [commentEndBang](char)
    {
        if (char === '-')
        {
            this.emit(T.commentData,
            {
                error: 'comment data should not contain --!'
            })
            this.state = commentEndDash
        }
        else if (char === '>')
        {
            this.emitInclusive(T.commentEnd,
            {
                error: 'comment should end with -->'
            })
            this.state = data
        }
        else
        {
            this.emit(T.commentData,
            {
                error: 'comment data should not contain --!'
            })
            this.state = comment
        }
    }

    [bogusComment](char)
    {
        if (char === '>')
        {
            this.emit(T.commentData)
            this.emitInclusive(T.commentEndBogus)
            this.state = data
        }
        else
        {}
    }

    // ### RAWTEXT, RCDATA and PLAINTEXT states
    // Raw text may contain anything except the beginnings of an
    // end tag for the current element. Raw text cannot be escaped. 
    // The only rawtext elements in the HTML5 specification are
    // 'script' and 'style'. 
    // Rcdata may contain anyting like rawtext, but can be escaped,
    // that is, it may contain character references. 
    // Plaintext may contain anything, nothing can be escaped, and
    // does not have an endtag. 

    [plaintext](char)
    {}

    [rawtext](char)
    {
        if (char === '<')
        {
            this.emit(T.rawtext)
            this.returnState = rawtext
            this.state = lessThanSignIn_
        }
        else
        {}
    }

    [rcdata](char)
    {
        if (char === '<')
        {
            this.emit(T.rcdata)
            this.returnState = rcdata
            this.state = lessThanSignIn_
        }
        else if (char === '&')
        {
            this.emit(T.rcdata)
            this.returnState = rcdata
            this.state = charRef
        }
        else
        {}
    }

    [lessThanSignIn_](char)
    {
        if (char === '/')
        {
            this.state = endTagOpenIn_
            this.tagType = endTag
            this.prefixCount = 0
        }
        else
        {
            this.emit(T.endTagPrefix)
            this.state = this.returnState
        }
    }

    // More fine-grained than the specification,
    // I am emitting 'endTagPrefix' tokens, which may be useful 
    // for escaping/ safe interpolation. 

    [endTagOpenIn_](char)
    {
        if (this.prefixCount < this.tagName.length)
        {
            if (char.toLowerCase() === this.tagName[this.prefixCount])
            {
                this.prefixCount++
            }
            else
            {
                this.emit(T.endTagPrefix)
                this.state = this.returnState
            }
        }
        else if (SPACE.test(char))
        {
            this.emit(T.endTagStart)
            this.state = beforeAttributeName
        }
        else if (char === '/')
        {
            this.emit(T.endTagStart)
            this.state = selfClosingStartTag
        }
        else if (char === '>')
        {
            this.emit(T.endTagStart)
            this.emitInclusive(T.tagEnd)
            this.state = data
        }
        else
        {
            this.emit(T.endTagPrefix)
            this.state = this.returnState
        }
    }

    // ### Character references

    // reached after `&` in data, rcdata or attribute data
    [charRef](char)
    {
        if (char === '#')
        {
            this.state = numericCharRef
        }
        else if (ALPHANUM.test(char))
        {
            this.state = charRefNamed
        }
        else
        {
            this.emit(T.bogusCharRef)
            this.state = this.returnState
            return false /* Branch does not consume */
        }
    }

    // reached after `&#`
    [numericCharRef](char)
    {
        if (char === 'x' || char === 'X')
        {
            this.state = charRefHex
        }
        else if (DIGITS.test(char))
        {
            this.state = charRefDecimal
        }
        else
        {
            this.emit(T.bogusCharRef)
            this.state = this.returnState
            return false /* Branch does not consume */
        }
    }

    [charRefDecimal](char)
    {
        if (DIGITS.test(char))
        {}
        else if (char === ';')
        {
            this.emitInclusive(T.charRefDecimal)
            this.state = this.returnState
        }
        else
        {
            this.emit(T.charRefDecimal,
            {
                error: 'unterminated decimal character reference'
            })
            this.state = this.returnState
            return false /* Branch does not consume */
        }
    }

    // reached after `&#x` or `&#X`
    [charRefHex](char)
    {
        if (HEXDIGITS.test(char))
        {
            this.state = hexDigits
        }
        else
        {
            this.emit(T.bogusCharRef)
            this.state = this.returnState
            return false /* Branch does not consume */
        }
    }

    [hexDigits](char)
    {
        if (HEXDIGITS.test(char))
        {}
        else if (char === ';')
        {
            this.emitInclusive(T.charRefHex)
            this.state = this.returnState
        }
        else
        {
            this.emit(T.charRefHex,
            {
                error: 'unterminated hexadecimal character reference'
            })
            this.state = this.returnState
            return false /* Branch does not consume */
        }
    }

    [charRefNamed](char)
    {
        // TODO, so the max length of named refs is 32
        // so it's an idea to cut it off after that and let emit handle the splitting/ fixup
        if (ALPHANUM.test(char))
        {}
        else if (char === ';')
        {
            this.emitInclusive(T.charRefNamed,
            {
                inAttribute: this.returnState === attributeValueData
            })
            this.state = this.returnState
        }
        else
        {
            this.emit(T.charRefNamed,
            {
                inAttribute: this.returnState === attributeValueData,
                nextChar: char
            })
            this.state = this.returnState
            return false /* Branch does not consume */
        }
    }

}

// ## Support for legacy character references,

// 'Special' character references are named character references that may 
// occur without a terminating semicolon. 

// `SPECIALS` and `PREFIXED` result from preprocessing the table of all
// entity names in the HTML5 specification, specifically, by selecting
// 1. The names that may occur without a terminating semicolon (specials). 
// 2. Semicolon terminated names that have a special as a prefix (prefixeds).

const SPECIALS = /^&([AEIOUYaeiouy]?acute|[AEIOUaeiou](?:grave|circ|uml)|y?uml|[ANOano]tilde|[Aa]ring|[Oo]slash|[Cc]?cedil|brvbar|curren|divide|frac(?:12|14|34)|iquest|middot|plusmn|(?:AE|ae|sz)lig|[lr]aquo|iexcl|micro|pound|THORN|thorn|times|COPY|copy|cent|macr|nbsp|ord[fm]|para|QUOT|quot|sect|sup[123]|AMP|amp|ETH|eth|REG|reg|deg|not|shy|yen|GT|gt|LT|lt)(;|.*)/

const PREFIXED = /^&(?:copysr|centerdot|divideontimes|[gl]t(?:quest|dot|cir|cc)|[gl]trPar|gtr(?:dot|less|eqqless|eqless|approx|arr|sim)|ltr(?:i|if|ie|mes)|ltlarr|lthree|notin(?:dot|E|v[abc])?|notni(?:v[abc])?|parallel|times(?:bar|d|b));/

// TODO clean this up a bit

function splitCharRef(string, inAttribute, nextChar)
{

    // A semicolon terminated, known charref
    if (PREFIXED.test(string))
        return [
            [T.charRefNamed, string]
        ]

    // Test 'special' charrefs (terminated or nonterminated)
    var r = SPECIALS.exec(string)
    var terminated = string[string.length - 1] === ';'

    // Not a special charref, nor one with trailing alphanums
    if (!r) return (terminated // TODO check this
        ?
        [
            [T.charRefNamed, string]
        ] :
        [
            [inAttribute ? T.attributeValueData : 'data', string]
        ])

    // A semicolon terminated special charref
    if (r[2] === ';')
        return [
            [T.charRefNamed, '&' + r[1] + ';']
        ]

    // A nonterminated special charref (exact match)
    if (r[2] === '')
        return (!inAttribute || nextChar !== '=') ?
            [
                [T.charRefLegacy, string]
            ] // And also a parse error
            :
            [
                [T.attributeValueData, string]
            ]

    // A nonterminated special charref with trailing alphanums
    // NB Splitting should always produce a parse error
    else return (!inAttribute) ?
        [
            [T.charRefLegacy, '&' + r[1]],
            ['data', r[2]]
        ] :
        [
            [T.attributeValueData, string]
        ]

}

export function Tokenizer()
{
    this.stack  = [];
    this.parent = [];
    this.curr = null;
    this.currAttr = null;
}

Tokenizer.prototype.tokenize = function(jsxStr)
{
    let _this = this;

    const delegate =
    {
        write: function(token){_this.readtoken(token);},
        end: () => 
        {
            return this.stack;
        }
    }

    const lexer = new Lexer (delegate);

    lexer.write(jsxStr);

    lexer.end();

    console.log(this.stack);

    return this.stack;
}

Tokenizer.prototype.closeJsx = function(value)
{    
    value = value.trim();
    value = value.substr(0, value.length - 1);

    while (this.curr.type !== '#jsxFunc')
    {
        this.curr = this.parent.pop();
    }

    this.curr.close = value;
}

Tokenizer.prototype.openJsx = function(value)
{   
    this.pushNode({
        type : '#jsxFunc',
        open : value.trim().substring(1)
    });
}

Tokenizer.prototype.pushNode = function(node)
{
    if (this.curr)
    {
        if (!this.curr.children) this.curr.children = [];

        this.curr.children.push(node);
    }
    else
    {
        this.stack.push(node);
    }

    this.curr = node;
    this.parent.push(this.curr);
}

Tokenizer.prototype.pushJsx = function(jsx)
{
    jsx = jsx.trim();

    jsx = jsx.substr(0, jsx.length - 1).substring(1).trim();

    this.pushChild({
        type: '#jsx',
        value: jsx
    });
}

Tokenizer.prototype.pushChild = function(node)
{
    if (this.curr)
    {
        if (!this.curr.children) this.curr.children = [];

        this.curr.children.push(node);
    }
    else
    {
        this.stack.push(node);
    }
}

Tokenizer.prototype.closeNode = function()
{
    this.curr = this.parent.pop();
}

Tokenizer.prototype.pushAttr = function(value)
{
    if (!this.curr.props) this.curr.props = {};

    this.curr.props[value] = true;

    this.currAttr = value;
}

Tokenizer.prototype.pushAttrVal = function(value)
{
    console.log(value);

    this.curr.props[this.currAttr] = value;

    this.currAttr = null;
}

Tokenizer.prototype.readtoken = function(token)
{
    let type  = token[0];
    let value = token[1];

    switch (type)
    {
        case 'data':
            this.pushChild({
                type: '#text',
                value : value
            });
            break;

        case 'jsx':
            this.pushJsx(value);
            break;

        case 'jsxFuncOpen':
            this.openJsx(value);
            break;

        case 'jsxFuncClose':
            this.closeJsx(value);
            break;

        case 'tagEndAutoclose':
            this.closeNode();
            break;

        case 'endTagStart':
            this.closeNode();
            break;

        case 'tagName':
            
            // Open
            if (this.prev === 'startTagStart')
            {
                let tag = value[0] === value[0].toUpperCase() ? `${value}` : `'${value}'`;
                
                this.pushNode({
                    type : tag,
                });
            }

            break;

        case 'attributeName':
            this.pushAttr(value);
            break;

        case 'attributeValueData':
            this.pushAttrVal(value);
            break;
    }

    this.prev = type;

    console.log (token);
}