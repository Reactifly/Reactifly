export class JsxSyntaxError extends Error
{
    constructor(error)
    {
        super('JSX syntax error');
        
        this.name = 'JsxSyntaxError';

        console.error(error);
    }
}