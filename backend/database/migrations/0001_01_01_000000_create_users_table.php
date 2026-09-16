<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
{
    Schema::dropIfExists('users');

    DB::statement('
        CREATE TABLE users (
            id UUID PRIMARY KEY,
            full_name VARCHAR(255) NOT NULL,
            username VARCHAR(255) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            email_verified_at TIMESTAMP NULL,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(100) NULL,
            divisi VARCHAR(100) NULL,
            no_hp VARCHAR(50) NULL,
            avatar_path TEXT NULL,
            is_active SMALLINT DEFAULT 1,
            must_change_password SMALLINT DEFAULT 0,
            remember_token VARCHAR(100) NULL,
            created_at TIMESTAMP NULL,
            updated_at TIMESTAMP NULL
        )
    ');
}

public function down(): void
{
    Schema::dropIfExists('users');
}
};