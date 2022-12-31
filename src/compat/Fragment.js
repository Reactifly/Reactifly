import { Component } from './Component';

/**
 * Fragment component.
 */
export function Fragment(p, context)
{
    this.props = p;

    this.context = context;
}

Fragment.prototype = new Component();
Fragment.prototype.constructor = Fragment;