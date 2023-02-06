class JsxError extends Error
{
    constructor(message)
    {
        super(message);

        this.name = 'JsxError';
    }
}

class ReactiflyError extends Error
{
    constructor(message)
    {
        super(message);
        
        this.name = 'ReactiflyError';
    }
}