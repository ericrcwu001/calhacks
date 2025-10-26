"""
Simple test endpoint
"""
import json
import os
import sys


def handler(event):
    """Test handler - single parameter"""
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'success': True,
            'message': 'Test endpoint works!',
            'has_google_key': bool(os.getenv('GOOGLE_API_KEY')),
            'python_version': sys.version,
            'event_type': str(type(event))
        })
    }
