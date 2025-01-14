document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  document.querySelector('#submit-compose-form').addEventListener('click', (e) => {
      e.preventDefault();
      send_email()
  })

});

function compose_email() {

  // Show compose view and hide other views
  select_tab('compose-view')

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function select_tab(show_tab) {
    const app_tabs = ['compose-view', 'display-email', 'emails-view']

    app_tabs.forEach(tab => {
        if (show_tab === tab) {
            document.querySelector('#' + tab).style.display = 'block'
            console.log('show_tab is: ', show_tab)
        } else {
            document.querySelector('#' + tab).style.display = 'none'
            document.querySelector('#' + tab).style.display = 'none'
        }
    })
}

function load_mailbox(mailbox) {
  select_tab('emails-view')

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  get_emails_for_mailbox(mailbox)
}

function send_email() {
    let recipients = document.querySelector('#compose-recipients').value
    let subject = document.querySelector('#compose-subject').value
    let body = document.querySelector('#compose-body').value

    fetch('/emails', {
            method: 'POST',
            body: JSON.stringify({
                recipients: recipients,
                subject: subject,
                body: body
            })
        })
        .then(response => response.json())
        .then(result => {
            load_mailbox('sent')
        });

}

function get_emails_for_mailbox(mailbox) {
    fetch('/emails/' + mailbox)
        .then(response => response.json())
        .then(emails => {
            let main_div = document.createElement('div')
            emails.forEach(email => {
                let row = create_email_main_row(mailbox, email)
                main_div.append(row)
            })

            document.querySelector('#emails-view').append(main_div)
        });
}

function create_email_main_row(mailbox, email) {

    const email_row = create_email_row()
    const email_div = create_email_div(email)
    const email_sender = crete_email_sender_column(email)
    const email_subject = create_email_subject_column(email)
    const email_timestamp = create_email_timestamp_column(email)
    const email_recipients = create_email_recipients_column(email)

    if (mailbox === 'inbox') {
        email_div.className += ' col-10 row '
        email_row.className += email.read ? ' background-gray ' : ''
        const button_to_archive = create_button_to_archive(email)

        append_to_element(email_div, [email_sender, email_subject, email_timestamp])
        append_to_element(email_row, [email_div, button_to_archive])
    } else if(mailbox === 'sent') {
        email_timestamp.style.justifyContent = ' flex-end '
        email_div.className = ' col-12 row '

        append_to_element(email_div, [email_subject, email_recipients, email_timestamp])
        email_row.append(email_div)
    } else if(mailbox === 'archive') {
        const button_to_unarchive = create_button_to_unarchive(email)
        email_timestamp.className = ' text-right '
        email_div.className = ' col-10 row '

        append_to_element(email_div, [email_subject, email_sender, email_timestamp])
        append_to_element(email_row, [email_div, button_to_unarchive])
    }

    return email_row
}

function append_to_element(element, array_of_elements) {
    array_of_elements.forEach(array_element => {
        element.append(array_element)
    })
    return element
}

function get_single_email(email_id) {

    fetch('/emails/' + email_id)
        .then(response => response.json())
        .then(email => {
            make_email_read(email_id)
            select_tab('display-email')

            document.querySelector('#display-email-sender').innerHTML =  email.sender
            document.querySelector('#display-email-recipients').innerHTML = email.recipients
            document.querySelector('#display-email-subject').innerHTML = email.subject
            document.querySelector('#display-email-timestamp').innerHTML = email.timestamp
            document.querySelector('#display-email-body').innerHTML = email.body

            document.querySelector('#reply-to-email-button').addEventListener('click', (e) => {
                reply_to_email(email)
            })
        });
}

function make_email_read(email_id) {

    fetch('/emails/' + email_id, {
        method: 'PUT',
        body: JSON.stringify({
          read: true
        })
    })
}

function make_email_archived(email_id) {

    fetch('/emails/' + email_id, {
        method: 'PUT',
        body: JSON.stringify({
          archived: true
        })
    })
      .then(result => {
            load_mailbox('inbox')
      })

}

function make_email_unarchived(email_id) {

    fetch('/emails/' + email_id, {
        method: 'PUT',
        body: JSON.stringify({
          archived: false
        })
    })
      .then(result => {
            load_mailbox('inbox')
      })

}

function reply_to_email(email) {

    // Show compose view and hide other views
    select_tab('compose-view')

    const subject = email.subject.substring(0, 4) === 'Re: ' ? email.subject : 'Re: ' + email.subject
    const body = '"On ' + email.timestamp + ' ' + email.sender + ' wrote: ' + '\n' + email.body + '"'

    document.querySelector('#compose-recipients').value = email.sender;
    document.querySelector('#compose-subject').value = subject;
    document.querySelector('#compose-body').value = body;
}

function create_email_row() {
    const email_row = document.createElement('div')
    email_row.className = ' row email-row '

    return email_row
}

function create_email_div(email) {
    const email_div = document.createElement('div')
    email_div.setAttribute('onclick', 'get_single_email(' + email.id + ')')

    return email_div
}

function crete_email_sender_column(email) {
    const email_sender = document.createElement('div')
    email_sender.innerHTML = email.sender
    email_sender.className = ' col-4 email-column '

    return email_sender
}

function create_email_subject_column(email) {
    const email_subject = document.createElement('div')
    email_subject.innerHTML = email.subject
    email_subject.className = ' col-4 email-column '

    return email_subject
}

function create_email_timestamp_column(email) {
    const email_timestamp = document.createElement('div')
    email_timestamp.innerHTML = email.timestamp
    email_timestamp.className = ' col-4 email-column text-right '

    return email_timestamp
}

function create_email_recipients_column(email) {
    const email_recipients = document.createElement('div')
    email_recipients.innerHTML = email.recipients
    email_recipients.className = ' col-4 email-column '

    return email_recipients
}

function create_button_to_archive(email) {
    const button_div = document.createElement('div')
    const button = document.createElement('button')

    button.innerHTML = 'Send to Archive'
    button_div.append(button)

    button_div.className = ' text-right col-2 '
    button.className = ' btn btn-info '
    button.setAttribute('onclick', 'make_email_archived(' + email.id + ')')

    return button_div
}

function create_button_to_unarchive(email) {
    const button_div = document.createElement('div')
    const button = document.createElement('button')

    button.innerHTML = 'Send to Inbox'
    button_div.append(button)

    button_div.className = ' text-right col-2 '
    button.className = ' btn btn-info '
    button.setAttribute('onclick', 'make_email_unarchived(' + email.id + ')')

    return button_div
}
