<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => ['http://localhost:4200', 'http://127.0.0.1:4200'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => ['*'],

    'max_age' => 0,

    'supports_credentials' => true,

    'headers' => [
        'Access-Control-Allow-Origin' => ['http://localhost:4200', 'http://127.0.0.1:4200'],
        'Access-Control-Allow-Methods' => 'POST, GET, OPTIONS, PUT, DELETE',
        'Access-Control-Allow-Headers' => 'Content-Type, X-Auth-Token, Origin, Authorization',
        'Access-Control-Allow-Credentials' => 'true',
        'Cross-Origin-Opener-Policy' => 'unsafe-none',
        'Cross-Origin-Embedder-Policy' => 'unsafe-none'
    ],

];
