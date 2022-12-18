import { in_dom } from '../utils/index';

const _events = {};

/**
 * Add an event listener
 *
 * @access public
 * @param  node    element    The target DOM node
 * @param  string  eventName  Event type
 * @param  closure handler    Callback event
 * @param  bool    useCapture Use capture (optional) (defaul false)
 */
export function addEventListener(element, eventName, handler, useCapture)
{
    // Boolean use capture defaults to false
    useCapture = typeof useCapture === 'undefined' ? false : Boolean(useCapture);

    // Class event storage
    var events = _events;

    // Make sure events are set
    if (!events)
    {
        _events = events = {};
    }

    // Make sure an array for the event type exists
    if (!events[eventName])
    {
        events[eventName] = [];
    }

    // Arrays
    if (Array.isArray(element))
    {
        for (var i = 0; i < element.length; i++)
        {
            addEventListener(element[i], eventName, handler, useCapture);
        }
    }
    else
    {
        // Push the details to the events object
        events[eventName].push(
        {
            element: element,
            handler: handler,
            useCapture: useCapture,
        });

        _addListener(element, eventName, handler, useCapture);
    }
}

/**
 * Removes event listeners on a DOM node
 *
 * If no event name is given, all attached event listeners are removed.
 * If no callback is given, all callbacks for the event type will be removed.
 * This function can still remove "annonymous" functions that are given a name as they are declared.
 * 
 * @access public
 * @param  node    element    The target DOM node
 * @param  string  eventName  Event type
 * @param  closure handler    Callback event
 * @param  bool    useCapture Use capture (optional) (defaul false)
 */
export function removeEventListener(element, eventName, handler, useCapture)
{
    if (Array.isArray(element))
    {
        for (var j = 0; j < element.length; j++)
        {
            removeEventListener(element[j], eventName, handler, useCapture);
        }
    }
    else
    {
        // If the eventName name was not provided - remove all event handlers on element
        if (!eventName)
        {
            return _removeElementListeners(element);
        }

        // If the callback was not provided - remove all events of the type on the element
        if (!handler)
        {
            return _removeElementTypeListeners(element, eventName);
        }

        // Default use capture
        useCapture = typeof useCapture === 'undefined' ? false : Boolean(useCapture);

        var eventObj = _events[eventName];

        if (typeof eventObj === 'undefined')
        {
            return;
        }

        // Loop stored events and match node, event name, handler, use capture
        for (var i = 0, len = eventObj.length; i < len; i++)
        {
            if (eventObj[i]['handler'] === handler && eventObj[i]['useCapture'] === useCapture && eventObj[i]['element'] === element)
            {
                _removeListener(element, eventName, handler, useCapture);

                _events[eventName].splice(i, 1);

                break;
            }
        }
    }
}

/**
 * Removes all event listeners registered by the library
 *
 * @access public
 */
export function clearEventListeners()
{
    var events = _events;

    for (var eventName in events)
    {
        var eventObj = events[eventName];

        var i = eventObj.length;

        while (i--)
        {
            _removeListener(eventObj[i]['element'], eventName, eventObj[i]['handler'], eventObj[i]['useCapture']);

            _events[eventName].splice(i, 1);
        }
    }
}

/**
 * Removes all event listeners registered by the library on nodes
 * that are no longer part of the DOM tree
 *
 * @access public
 */
export function collectGarbage()
{
    var events = _events;
    for (var eventName in events)
    {
        var eventObj = events[eventName];
        
        var i = eventObj.length;

        while (i--)
        {
            var el = eventObj[i]['element'];

            // the window, body, and document always exist so keep these listeners
            if (el == window || el == document || el == document.body)
            {
                continue;
            }
            
            if (!_.in_dom(el))
            {
                _removeListener(eventObj[i]['element'], eventName, eventObj[i]['handler'], eventObj[i]['useCapture']);
                
                _events[eventName].splice(i, 1);
            }
        }
    }
}

/**
 * Removes all registered event listners on an element
 *
 * @access private
 * @param  node    element Target node element
 */
function _removeElementListeners(element)
{
    var events = _events;

    for (var eventName in events)
    {
        var eventObj = events[eventName];

        var i = eventObj.length;

        while (i--)
        {
            if (eventObj[i]['element'] === element)
            {
                _removeListener(eventObj[i]['element'], eventName, eventObj[i]['handler'], eventObj[i]['useCapture']);
                
                _events[eventName].splice(i, 1);
            }
        }
    }
}

/**
 * Removes all registered event listners of a specific type on an element
 *
 * @access private
 * @param  node    element Target node element
 * @param  string  type    Event listener type
 */
function _removeElementTypeListeners(element, type)
{
    var eventObj = _events[type];

    var i = eventObj.length;

    while (i--)
    {
        if (eventObj[i]['element'] === element)
        {
            _removeListener(eventObj[i]['element'], type, eventObj[i]['handler'], eventObj[i]['useCapture']);
            
            _events[type].splice(i, 1);
        }
    }
}

/**
 * Adds a listener to the element
 *
 * @access private
 * @param  node    element    The target DOM node
 * @param  string  eventName  Event type
 * @param  closure handler    Callback event
 * @param  bool    useCapture Use capture (optional) (defaul false)
 */
function _addListener(el, eventName, handler, useCapture)
{
    if (el.addEventListener)
    {
        el.addEventListener(eventName, handler, useCapture);
    }
    else
    {
        el.attachEvent('on' + eventName, handler, useCapture);
    }
}

/**
 * Removes a listener from the element
 *
 * @access private
 * @param  node    element    The target DOM node
 * @param  string  eventName  Event type
 * @param  closure handler    Callback event
 * @param  bool    useCapture Use capture (optional) (defaul false)
 */
function _removeListener(el, eventName, handler, useCapture)
{
    if (el.removeEventListener)
    {
        el.removeEventListener(eventName, handler, useCapture);
    }
    else
    {
        el.detachEvent('on' + eventName, handler, useCapture);
    }
}

export default { addEventListener, removeEventListener, clearEventListeners, collectGarbage };