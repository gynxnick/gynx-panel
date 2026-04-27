{{--
    Layouts: admin (alias)
    ----------------------
    Historical Pterodactyl admin pages still call @extends('layouts.admin').
    This file delegates to layouts.gynx-admin so those pages render on the
    gynx shell without any per-file rewrite. Their @section('title'),
    @section('content'), @section('content-header'), and
    @section('footer-scripts') flow through unchanged because Blade keeps
    sections live across the @extends chain.

    Pages that ALREADY extend layouts.gynx-admin (Branding / License /
    Integrations / Subdomains / Users) bypass this file entirely.
--}}
@extends('layouts.gynx-admin')
