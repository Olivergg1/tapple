// 1xx informational response – the request was received, continuing process

// 2xx successful – the request was successfully received, understood, and accepted
export const OK = 200
export const CREATED = 201

// 3xx redirection – further action needs to be taken in order to complete the request

// 4xx client error – the request contains bad syntax or cannot be fulfilled
export const BAD_REQUEST = 400
export const UNAUTHORIZED = 401
export const FORBIDDEN = 403
export const NOT_FOUND = 404
export const METHOD_NOT_ALLOWED = 405

// 5xx server error – the server failed to fulfil an apparently valid request
export const INTERNAL_SERVER_ERROR = 500
