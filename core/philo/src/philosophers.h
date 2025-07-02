/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   philosophers.h                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: adahroug <adahroug@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/03/28 16:26:15 by adahroug          #+#    #+#             */
/*   Updated: 2025/03/29 16:09:00 by adahroug         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#	ifndef PHILOSOPHERS_H
# define PHILOSOPHERS_H
# include <unistd.h>
# include <stdlib.h>
# include <stdio.h>
# include <pthread.h>
# include <sys/time.h>
# include <limits.h>
# include <errno.h>
# include <string.h>
# include <stdbool.h>
# define DEBUG_MODE 0

typedef struct s_data	t_data;

typedef pthread_mutex_t	t_mutex;

typedef struct s_fork
{
	t_mutex	fork;
	int		fork_id;
}	t_fork;

typedef struct s_philo
{
	int			id;
	long		meals_counter;
	int			full;
	long		last_meal_time;
	t_fork		*left_fork;
	t_fork		*right_fork;
	pthread_t	thread_id;
	t_mutex		philo_mutex;
	t_data		*ptr;
}	t_philo;

typedef struct s_data
{
	long		philo_nb;
	long		time_to_die;
	long		time_to_eat;
	long		time_to_sleep;
	long		max_meals;
	long		start_simulation;
	long		threads_running_nbr;
	int			all_philos_ready;
	int			end_simulation;
	pthread_t	monitor;
	t_mutex		table_mutex;
	t_mutex		write_mutex;
	t_fork		*forks;
	t_philo		*philos;
}	t_data;

typedef enum e_timecode
{
	SECONDS,
	MILLISECONDS,
	MICROSECONDS,
}	t_timecode;

typedef enum s_philo_status
{
	EATING,
	SLEEPING,
	THINKING,
	TAKE_left_fork,
	TAKE_right_fork,
	DIED,
}	t_philo_status;
typedef enum s_state
{
	LOCK,
	UNLOCK,
	INIT,
	DESTROY,
	CREATE,
	JOIN,
	DETACH
}	t_state;

void		error_exit(const char *str);
void		parse_input(t_data *ptr, char **argv);
int			count_argv(char **argv);
const char	*valid_input(const char *str);
long		ft_atol(const char *str);
int			is_space(char c);
int			is_digit(char c);
void		string_to_int(t_data *ptr, char **argv, int *counter);

void		*safe_malloc(size_t bytes);
void		safe_mutex_handle(t_mutex *mutex, t_state mutex_state);
void		safe_thread_handle(pthread_t *thread, void *(*foo) (void *),
				void *data, t_state thread_state);
void		handle_thread_error(int status, t_state thread_state);
void		handle_mutex_error(int status, t_state mutex_state);
void		philo_init(t_data *ptr);
void		assign_forks_properly(t_philo *p, t_fork *forks);
void		setup(t_data *ptr);
void		dinner_start(t_data *ptr);
void		set_int(t_mutex *mutex, int *dest, int value);
int			get_int(t_mutex *mutex, int *value);
long		get_long(t_mutex *mutex, long *value);
void		set_long(t_mutex *mutex, long *dest, long value);
int			simulation_finished(t_data *ptr);
void		increase_long(t_mutex *mutex, long *value);
void		wait_all_threads(t_data *ptr);
long		gettime(t_timecode time_code);
void		precise_usleep(long usec, t_data *ptr);
void		clean(t_data *ptr);
void		write_status(t_philo_status status, t_philo *philo, bool DEBUG);
bool		all_threads_running(t_mutex *mutex, long *threads, long philo_nbr);
void		increase_long(t_mutex *mutex, long *value);
bool		all_threads_running(t_mutex *mutex, long *threads, long philo_nbr);
void		clean(t_data *ptr);
int			philo_died(t_philo *philo);
void		*monitor_dinner(void *data);
void		thinking(t_philo *philo, bool pre_simulation);
void		desynchronize_philos(t_philo *philo);
int			check_philos_full(t_data *ptr);
int			check_philo_death(t_data *ptr);
void		check_threads_running(t_data *ptr);

#endif