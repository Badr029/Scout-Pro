<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ApiResponseFormatter
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // Only modify JSON responses
        if ($response instanceof JsonResponse) {
            $data = $response->getData();

            // If response is already formatted, return as is
            if (isset($data->status) && isset($data->data)) {
                return $response;
            }

            // Format the response
            $formatted = [
                'status' => $response->getStatusCode() < 400 ? 'success' : 'error',
                'data' => $data,
                'message' => property_exists($data, 'message') ? $data->message : null,
                'errors' => property_exists($data, 'errors') ? $data->errors : null,
            ];

            $response->setData($formatted);
        }

        return $response;
    }
}
