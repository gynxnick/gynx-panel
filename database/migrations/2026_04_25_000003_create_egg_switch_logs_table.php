<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('egg_switch_logs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedInteger('server_id');
            $table->unsignedInteger('actor_user_id');
            $table->unsignedInteger('source_egg_id');
            $table->unsignedInteger('target_egg_id');
            $table->boolean('preserved_files');
            $table->enum('status', ['queued', 'running', 'success', 'failed'])->default('queued');
            $table->text('error')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['server_id', 'created_at'], 'egg_switch_logs_server_recent');

            $table->foreign('server_id')
                ->references('id')->on('servers')
                ->cascadeOnDelete();
            $table->foreign('actor_user_id')
                ->references('id')->on('users')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('egg_switch_logs');
    }
};
