<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkLocation extends Model
{
    protected $fillable = [
        'location_name',
        'address',
        'latitude',
        'longitude',
        'radius_meter',
    ];

    public function employees()
    {
        return $this->hasMany(Employee::class);
    }
}