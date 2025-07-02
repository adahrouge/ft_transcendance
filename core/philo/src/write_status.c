/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   write_status.c                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: adahroug <adahroug@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/03/29 16:20:19 by adahroug          #+#    #+#             */
/*   Updated: 2025/03/29 16:20:59 by adahroug         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "philosophers.h"

void	write_status_debug(t_philo_status status, t_philo *philo, long elapsed)
{
	if (TAKE_left_fork == status && !simulation_finished(philo->ptr))
		printf("%6ld" "%d has taken the 1 fork\n", elapsed, philo->id);
	else if (TAKE_right_fork == status && !simulation_finished(philo->ptr))
		printf("%6ld" "%d has taken the 2 fork\n", elapsed, philo->id);
	else if (EATING == status && !simulation_finished(philo->ptr))
		printf("%6ld %d is eating %ld meal\n", elapsed, philo->id,
			philo->meals_counter);
	else if (status == SLEEPING && !simulation_finished(philo->ptr))
		printf("%6ld %d is sleeping\n", elapsed, philo->id);
	else if (status == THINKING && !simulation_finished(philo->ptr))
		printf("%6ld %d is thinking\n", elapsed, philo->id);
	else if (status == DIED)
		printf("%6ld %d died :(\n", elapsed, philo->id);
}

void	write_status(t_philo_status status, t_philo *philo, bool debug)
{
	long	elapsed;
	int		is_full;

	elapsed = gettime(MILLISECONDS) - philo->ptr->start_simulation;
	is_full = get_int(&philo->philo_mutex, &philo->full);
	if (is_full)
		return ;
	safe_mutex_handle(&philo->ptr->write_mutex, LOCK);
	if (debug)
		write_status_debug(status, philo, elapsed);
	else
	{
		if ((TAKE_left_fork == status || TAKE_right_fork == status)
			&& !simulation_finished(philo->ptr))
			printf("%-6ld" "%d has taken a fork\n", elapsed, philo->id);
		else if (status == EATING && !simulation_finished(philo->ptr))
			printf("%-6ld" "%d is eating\n", elapsed, philo->id);
		else if (status == SLEEPING && !simulation_finished(philo->ptr))
			printf("%-6ld" "%d is sleeping\n", elapsed, philo->id);
		else if (status == THINKING && !simulation_finished(philo->ptr))
			printf("%-6ld" "%d is thinking\n", elapsed, philo->id);
		else if (status == DIED)
			printf("%-6ld" "%d died\n", elapsed, philo->id);
	}
	safe_mutex_handle(&philo->ptr->write_mutex, UNLOCK);
}
