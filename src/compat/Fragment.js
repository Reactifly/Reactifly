import { Component } from './Component';
import { extend } from '../utils/index';

/**
 * Fragment component.
 */
function Fragment(p, context)
{
    this.props = p;

    this.context = context;
}

Fragment = extend(Component, Fragment);

export { Fragment };