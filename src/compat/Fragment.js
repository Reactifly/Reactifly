import { Component } from './Component';
import { extend } from '../utils/index';

/**
 * Fragment component.
 */
export function Fragment(p, context)
{
    this.props = p;

    this.context = context;
}

extend(Component, Fragment);