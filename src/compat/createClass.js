import { Component } from './Component';
import _ from '../utils/index';

/**
 * Generates a React "Component" class from an object
 *  
 * @param   {obj}  obj  Base object
 * @returns {object}
 */
export function createClass(obj)
{
    if (!_.is_object(obj))
    {
        throw new Error('Cannot create class with provided var type [' + typeof obj + ']. An object must be used to create a Reactifly class.');
    }

    let _component = !obj.constructor ? function() {} : obj.constructor;

    let props = _.object_props(obj);

    _.foreach(props, function(i, key)
    {
        _component.prototype[key] = obj[key];
    });

    return _.extend(Component, _component);
}