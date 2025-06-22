<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    protected $fillable = [
        'report_type',
        'reporter_id',
        'status',
        'admin_notes',
        'resolved_at',
        // Video report fields
        'video_id',
        'video_reason',
        // User report fields
        'reported_user_id',
        'user_reason',
        // Bug report fields
        'severity',
        'page_url',
        'browser_info',
        // Common field
        'description'
    ];

    protected $casts = [
        'resolved_at' => 'datetime',
        'browser_info' => 'json'
    ];

    public function reporter()
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }

    public function video()
    {
        return $this->belongsTo(Video::class, 'video_id');
    }

    public function reportedUser()
    {
        return $this->belongsTo(User::class, 'reported_user_id');
    }

    // Backward compatibility methods to maintain the same API structure
    public function videoReport()
    {
        if ($this->report_type === 'video') {
            return (object) [
                'reason' => $this->video_reason,
                'description' => $this->description,
                'video' => $this->video
            ];
        }
        return null;
    }

    public function userReport()
    {
        if ($this->report_type === 'user') {
            return (object) [
                'reason' => $this->user_reason,
                'description' => $this->description,
                'reportedUser' => $this->reportedUser
            ];
        }
        return null;
    }

    public function bugReport()
    {
        if ($this->report_type === 'bug') {
            return (object) [
                'severity' => $this->severity,
                'page_url' => $this->page_url,
                'description' => $this->description,
                'browser_info' => $this->browser_info
            ];
        }
        return null;
    }

    // Accessor methods for backward compatibility
    public function getVideoReportAttribute()
    {
        return $this->videoReport();
    }

    public function getUserReportAttribute()
    {
        return $this->userReport();
    }

    public function getBugReportAttribute()
    {
        return $this->bugReport();
    }
}
