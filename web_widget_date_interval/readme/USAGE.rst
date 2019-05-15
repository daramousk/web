To use this module, use the widget ``date_interval`` on the field representing
the begin of the interval.
Make sure to also add the field representing the end of the interval,
usually as hidden.
Also add an ``options`` dictionary where you at least set the keys ``type``
and ``end_field``.

Depending on the type, you can add more configuration in the widget options,
see below for a list depending on the interval type.

weeknumber_iso
--------------

``hide_years``
    if this is set, don't show a year selection
``years_before``
    allow the user to move to N years before the current date
    (or the field's value)
``years_after``
    allow the user to move to N years after the current date
    (or the field's value)
``week_type``
    `select` (default) will render a dropdown for weeks,
    `buttons` will show buttons
``weeks_before``
    allow the user to move to N weeks before the current date
    (or the field's value) if ``week_type`` has value `buttons`
``weeks_after``
    allow the user to move to N weeks after the current date
    (or the field's value) if ``week_type`` has value `buttons`


Example::

    <field name="date_start" widget="date_interval"
    options="{'type': 'weeknumber_iso', 'end_field': 'date_end'}" />

The module's demo data adds this to the form of model constraints.
