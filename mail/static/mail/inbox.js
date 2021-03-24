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
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#display-email').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#display-email').style.display = 'none';

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
            main_div.id = 'main_div_id'
            main_div.className = 'row'

            emails.forEach(email => {
                let email_container = document.createElement('div')
                let email_div = document.createElement('div')
                email_div.setAttribute('onclick', 'get_single_email(' + email.id + ')')

                let email_sender = '<p>From: ' + email.sender +'</p>'
                let email_subject = '<p>Subject: ' + email.subject + '</p>'
                let email_timestamp = '<p>Date: ' + email.timestamp + '</p>'
                let email_recipients = '<p>To: ' + email.recipients + '</p>'
                let button_to_archive_or_unarchive = create_button_to_archive_or_unarchive(email)

                if (mailbox === 'inbox') {
                    email_div.innerHTML = email_sender + email_subject + email_timestamp
                    email_container.innerHTML = button_to_archive_or_unarchive
                    email_container.className += ' background-gray '
                } else if(mailbox === 'sent') {
                    email_div.innerHTML = email_subject + email_recipients + email_timestamp
                } else if(mailbox === 'archive') {
                    email_div.innerHTML = email_sender + email_subject + email_timestamp
                    email_container.innerHTML = button_to_archive_or_unarchive
                }

                email_container.id = 'email_container_id_' + email.id
                email_container.className += ' col-12 mt-2 main_email_div card email_container '

                email_container.append(email_div)
                main_div.append(email_container)

            })

            let emails_view = document.querySelector('#emails-view')
            emails_view.append(main_div)

        });
}

function create_button_to_archive_or_unarchive(email) {
        let button_text = email.archived ? 'Send to Inbox' : 'Send to Archive'

        return '<div class="text-right">'
            + '<button class="btn btn-info" onclick="make_email_archived_unarchived(' + email.id + ',' + email.archived + ')">'
            + button_text + '</button></div>'
}

function get_single_email(email_id) {

    fetch('/emails/' + email_id)
        .then(response => response.json())
        .then(email => {
            make_email_read(email_id)

            document.querySelector('#emails-view').style.display = 'none';
            document.querySelector('#display-email').style.display = 'block';

            document.querySelector('#display-email-sender').innerHTML = '<b>From</b> ' + email.sender
            document.querySelector('#display-email-recipients').innerHTML = '<b>To</b> ' + email.recipients
            document.querySelector('#display-email-subject').innerHTML = '<b>Subject:</b> ' + email.subject
            document.querySelector('#display-email-timestamp').innerHTML = '<b>Timestamp:</b> ' + email.timestamp
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

function make_email_archived_unarchived(email_id, archived) {

    fetch('/emails/' + email_id, {
        method: 'PUT',
        body: JSON.stringify({
          archived: !archived
        })
    })
      .then(result => {
            load_mailbox('inbox')
      })

}

function reply_to_email(email) {
    console.log('reply_to_email here')
    console.log('email is: ', email)

      // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#display-email').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    let subject = email.subject.substring(0, 4) === 'Re: ' ? email.subject : 'Re: ' + email.subject
    let body = '"On ' + email.timestamp + ' ' + email.sender + ' wrote:" ' + '\n' + email.body

    document.querySelector('#compose-recipients').value = email.sender;
    document.querySelector('#compose-subject').value = subject;
    document.querySelector('#compose-body').value = body;
}
